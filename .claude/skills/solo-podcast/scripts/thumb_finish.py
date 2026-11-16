"""Turn a Higgsfield thumbnail generation into the file YouTube takes: 1920x1080 JPEG under 2 MB.

usage: python3 thumb_finish.py <image url or local file> <out.jpg>
Cover-crops to 16:9 around the centre, resizes to 1920x1080 and lowers JPEG quality until the file is under 2 MB.
Also writes <out>_preview.jpg (960x540) to look at through image_paths: check the spelling of both text lines before using it.
"""
import sys, os, subprocess
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
if src.startswith('http'):
    subprocess.run(['curl', '-sL', '-o', out + '.src', src], check=True); src = out + '.src'
im = Image.open(src).convert('RGB'); w, h = im.size
if w / h > 16 / 9: nw = round(h * 16 / 9); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
else: nh = round(w * 9 / 16); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
im = im.resize((1920, 1080), Image.LANCZOS)
for q in (92, 88, 84, 80, 75, 70):
    im.save(out, 'JPEG', quality=q, optimize=True)
    if os.path.getsize(out) < 2_000_000: break
im.resize((960, 540), Image.LANCZOS).save(os.path.splitext(out)[0] + '_preview.jpg', 'JPEG', quality=80)
print(out, im.size, os.path.getsize(out), 'bytes, quality', q)
