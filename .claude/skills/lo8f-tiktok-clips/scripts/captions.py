"""One-word captions for an LO8F clip, ready to burn in with finish.sh.

usage: python3 captions.py <key> [workdir]
needs in workdir: <key>_raw.mp4 (the Descript cut, with NO captions) and <key>_ref.txt (the exact words spoken, spelled as they should read on screen)
writes:           <key>_strips/*.png (1080x360 RGBA, one per word), <key>_caps.txt (ffmpeg concat list), <key>_words.json

Timing comes from faster-whisper (small.en, word timestamps). Spelling, capitals and punctuation come from the reference text.
The two are aligned word by word; a word whisper misheard or dropped gets its time from its neighbours.
Look (approved): white Manrope 800, 140 px, 14 px black outline, soft shadow, upright, centred near (540, 1114). Nothing before 3.0 s (hook title window).
Exits 1 when fewer than 80 % of the reference words were found in the audio: the reference text is wrong or belongs to another clip.
"""
import sys, os, re, json, subprocess, difflib, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

key = sys.argv[1]
os.chdir(sys.argv[2] if len(sys.argv) > 2 else '.')
FONT = os.environ.get('MANROPE', '/home/user/fonts/manrope/Manrope.ttf')
START = float(os.environ.get('CAPTION_START', '3.0'))
SIZE, STROKE, SW, SH, MAXW, BASELINE = 140, 14, 1080, 360, 1000, 216
MIN_MATCH, MAX_HOLD = 0.80, 1.5

def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))

ref = []
for tok in open(f'{key}_ref.txt', encoding='utf-8').read().split():
    if norm(tok) or not ref: ref.append(tok)
    else: ref[-1] += tok                     # a lone dash or quote mark rides on the previous word
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{key}_raw.mp4'],
                           capture_output=True, text=True).stdout)

from faster_whisper import WhisperModel
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{key}_raw.mp4', '-ac', '1', '-ar', '16000', f'{key}.wav'], check=True)
segs, _ = WhisperModel('small.en', device='cpu', compute_type='int8').transcribe(
    f'{key}.wav', word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
heard = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words if norm(w.word)]

a = [norm(w) for w in ref]; b = [norm(h[2]) for h in heard]
start = [None] * len(ref); matched = 0
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1): start[i1 + k] = heard[j1 + k][0]
        matched += i2 - i1
    elif tag == 'replace':                   # misheard: spread the reference words over the heard span
        t0, t1 = heard[j1][0], heard[j2 - 1][1]
        for k in range(i2 - i1): start[i1 + k] = t0 + (t1 - t0) * k / (i2 - i1)
known = [i for i, t in enumerate(start) if t is not None]
if not known: sys.exit('no reference word was found in the audio')
for i in range(len(ref)):                    # dropped words: interpolate between known neighbours
    if start[i] is not None: continue
    prev = max([k for k in known if k < i], default=None); nxt = min([k for k in known if k > i], default=None)
    if prev is None: start[i] = max(0.0, start[nxt] - 0.25 * (nxt - i))
    elif nxt is None: start[i] = min(dur - 0.1, start[prev] + 0.3 * (i - prev))
    else: start[i] = start[prev] + (start[nxt] - start[prev]) * (i - prev) / (nxt - prev)
for i in range(1, len(ref)): start[i] = max(start[i], start[i - 1] + 0.04)

ratio = matched / len(ref)
print(f'{len(ref)} reference words, {len(heard)} heard, match {ratio:.2f}, duration {dur:.2f}s')
print(' '.join(f'{w}@{t:.1f}' for w, t in zip(ref, start)))
json.dump([[round(t, 2), w] for w, t in zip(ref, start)], open(f'{key}_words.json', 'w'))
if ratio < MIN_MATCH: sys.exit(f'match {ratio:.2f} is under {MIN_MATCH}: fix {key}_ref.txt (wrong clip, or words that were cut)')

def strip(text, out):
    size = SIZE
    while True:
        f = ImageFont.truetype(FONT, size); f.set_variation_by_axes([800])
        l, t, r, bt = f.getbbox(text, stroke_width=STROKE, anchor='ms')
        if r - l <= MAXW or size <= 70: break
        size -= 6
    sh = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((SW / 2, BASELINE + 4), text, font=f, fill=(0, 0, 0, 170), anchor='ms', stroke_width=STROKE, stroke_fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    im = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((SW / 2, BASELINE), text, font=f, fill=(255, 255, 255, 255), anchor='ms', stroke_width=STROKE, stroke_fill=(0, 0, 0, 255))
    Image.alpha_composite(sh, im).save(out)

d = f'{key}_strips'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
blank = os.path.abspath(f'{d}/blank.png'); Image.new('RGBA', (SW, SH), (0, 0, 0, 0)).save(blank)
items, t = [], 0.0                           # (file, duration) covering 0 .. dur with no holes
for i, (w, s) in enumerate(zip(ref, start)):
    if s < START - 0.05 or s >= dur: continue
    s = max(s, START)
    e = min(start[i + 1] if i + 1 < len(ref) else dur, s + MAX_HOLD, dur)
    if e - s < 0.03: continue
    if s > t: items.append((blank, s - t))
    p = os.path.abspath(f'{d}/w{i:03d}.png'); strip(w.strip('"“”'), p); items.append((p, e - s)); t = e
if dur > t: items.append((blank, dur - t))
with open(f'{key}_caps.txt', 'w') as fh:
    for p, sec in items: fh.write(f"file '{p}'\nduration {sec:.3f}\n")
    fh.write(f"file '{items[-1][0]}'\n")      # the concat demuxer needs the last file repeated
print(f'{sum(1 for p, _ in items if p != blank)} caption words written')
