"""Hook-frame and label overlays for LO8F vertical clips (1080x1920 RGBA PNGs).

tt_overlay   -> TikTok / DOAC look: white rounded boxes, black UPPERCASE Inter Bold 92 px, lower third (y_center 0.70)
yt_overlay   -> YouTube Shorts look: white Inter Bold 118 px, one key word red (232,35,35), soft shadow, y_center 0.72
label_overlay-> "LO8F" white pill + speaker name, top-left (60,110); composited for the WHOLE clip on both variants

Fonts: Inter TTFs (extras/ttf from the Inter release zip). Set INTER to the "Inter-" prefix path.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, sys
INTER = os.environ.get('INTER_PREFIX', '/home/user/fonts/inter/extras/ttf/Inter-')
W, H = 1080, 1920

def yt_overlay(lines, red_word, out, size=118, y_center=0.72):
    """white bold lines, one (or several) words red, centred, soft shadow. lines: list of str"""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(INTER + 'Bold.ttf', size); lh = int(size * 1.12)
    total = lh * len(lines); y = int(H * y_center - total / 2)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    reds = red_word if isinstance(red_word, (list, tuple, set)) else [red_word]
    for ln in lines:
        words = ln.split(' '); widths = [d.textlength(w + ' ', font=f) for w in words]
        tw = sum(widths) - d.textlength(' ', font=f); x = (W - tw) / 2
        for w, wd in zip(words, widths):
            col = (232, 35, 35, 255) if w.strip(',.!?:') in reds else (255, 255, 255, 255)
            sd.text((x + 2, y + 8), w, font=f, fill=(0, 0, 0, 200))
            d.text((x, y), w, font=f, fill=col)
            x += wd
        y += lh
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    Image.alpha_composite(sh, im).save(out)

def tt_overlay(lines, out, size=92, y_center=0.70, label=None):
    """DOAC style: one white rounded box per line, black uppercase bold text. Keep each line <= ~19 characters."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(INTER + 'Bold.ttf', size); lh = int(size * 1.28); pad = int(size * 0.32)
    total = lh * len(lines); y = int(H * y_center - total / 2)
    for ln in lines:
        t = ln.upper(); tw = d.textlength(t, font=f); x = (W - tw) / 2
        if x - pad < 20: raise SystemExit(f'line too wide for 1080px: {t!r} -- split it or lower size')
        d.rounded_rectangle([x - pad, y - int(size * 0.14), x + tw + pad, y + int(size * 1.14)], radius=int(size * 0.22), fill=(255, 255, 255, 255))
        d.text((x, y), t, font=f, fill=(10, 10, 10, 255)); y += lh
    if label: draw_label(d, label)
    im.save(out)

def draw_label(d, label):
    lf = ImageFont.truetype(INTER + 'ExtraBold.ttf', 34); lf2 = ImageFont.truetype(INTER + 'SemiBold.ttf', 24)
    lx, ly = 60, 110
    tw = d.textlength(label[0], font=lf)
    d.rounded_rectangle([lx, ly, lx + tw + 28, ly + 52], radius=8, fill=(255, 255, 255, 235))
    d.text((lx + 14, ly + 6), label[0], font=lf, fill=(10, 10, 10, 255))
    d.text((lx + 2, ly + 62), label[1], font=lf2, fill=(255, 255, 255, 235))

def label_overlay(label, out):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); draw_label(d, label); im.save(out)

if __name__ == '__main__':
    # usage: python3 hookstyle.py <key> "<TT line 1>|<TT line 2>[|line 3]" "<YT line 1>|<YT line 2>|<YT line 3>" "<red word>" "<Speaker Name>" [outdir]
    key, tt, yt, red, name = sys.argv[1:6]; outdir = sys.argv[6] if len(sys.argv) > 6 else '.'
    tt_overlay(tt.split('|'), f'{outdir}/hook_{key}_tt.png')
    yt_overlay(yt.split('|'), red.split('|'), f'{outdir}/hook_{key}_yt.png')
    label_overlay(('LO8F', name), f'{outdir}/label_{key}.png')
    print('wrote', f'hook_{key}_tt.png hook_{key}_yt.png label_{key}.png')
