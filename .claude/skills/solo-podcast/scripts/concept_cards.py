"""Purple concept cards for the long-form edit: one glowing white icon on a purple gradient, 1920x1080 PNG, no text.

usage: python3 concept_cards.py <outdir> <icon> [<icon> ...]      e.g. concept_cards.py /home/user/cards bullhorn calendar-days robot
Icons are Font Awesome 6 Free Solid names (https://fontawesome.com/search?o=r&m=free&s=solid). Writes card-01-<icon>.png, card-02-<icon>.png ...
The card carries no words: the episode's own captions sit over it in the edit. Pick an icon that is the literal noun being said
(bullhorn for distribution, calendar-days for annual billing, robot for agents), at most one card per minute of video.
Needs /home/user/fonts/fa/fa-solid-900.ttf and icons.json; fetches them from the Font Awesome repo when missing.
"""
import sys, os, json, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FA = '/home/user/fonts/fa'; W, H = 1920, 1080
SRC = 'https://github.com/FortAwesome/Font-Awesome/raw/6.x/'
os.makedirs(FA, exist_ok=True)
for name, path in (('fa-solid-900.ttf', 'webfonts/fa-solid-900.ttf'), ('icons.json', 'metadata/icons.json')):
    if not os.path.exists(f'{FA}/{name}') or os.path.getsize(f'{FA}/{name}') < 1000:
        subprocess.run(['curl', '-sL', '-o', f'{FA}/{name}', SRC + path], check=True)
icons = json.load(open(f'{FA}/icons.json'))

def background():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W * 0.5) / (W * 0.62)) ** 2 + ((y - H * 0.57) / (H * 0.70)) ** 2).clip(0, 1) ** 1.25
    inner, outer = np.array([126, 0, 188], np.float32), np.array([58, 0, 98], np.float32)
    return Image.fromarray((inner + (outer - inner) * d[..., None]).astype(np.uint8), 'RGB').convert('RGBA')

def card(icon, out):
    if icon not in icons or 'solid' not in icons[icon]['styles']:
        sys.exit(f'"{icon}" is not a Font Awesome 6 free solid icon')
    ch = chr(int(icons[icon]['unicode'], 16)); size = 440
    while True:                                   # fit the glyph in a 470 x 450 box
        f = ImageFont.truetype(f'{FA}/fa-solid-900.ttf', size); l, t, r, b = f.getbbox(ch)
        if (r - l <= 470 and b - t <= 450) or size <= 200: break
        size -= 10
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).text((W / 2 - (l + r) / 2, 520 - (t + b) / 2), ch, font=f, fill=255)
    im = background()
    for radius, alpha in ((70, 0.30), (24, 0.60)):  # wide soft halo, then a tight glow
        glow = mask.filter(ImageFilter.GaussianBlur(radius)).point(lambda v: int(v * alpha))
        im = Image.alpha_composite(im, Image.merge('RGBA', (Image.new('L', (W, H), 255),) * 3 + (glow,)))
    im = Image.alpha_composite(im, Image.merge('RGBA', (Image.new('L', (W, H), 255),) * 3 + (mask,)))
    im.convert('RGB').save(out)

outdir = sys.argv[1]; os.makedirs(outdir, exist_ok=True)
for n, icon in enumerate(sys.argv[2:], 1):
    p = f'{outdir}/card-{n:02d}-{icon}.png'; card(icon, p); print('wrote', p)
