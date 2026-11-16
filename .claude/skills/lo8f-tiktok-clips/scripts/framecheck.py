"""Fail when a vertical render does not fill the frame (a 16:9 strip with black bars above and below).

usage: python3 framecheck.py <file.mp4>
Samples five frames. A bar is a band at the top AND the bottom tenth of the frame that is uniformly black (mean under 8, almost no variation).
Underlord has reported a crop as applied while the render came out letterboxed, so this runs before any captioning.
"""
import sys, subprocess, numpy as np
p = sys.argv[1]; W, H = 108, 192
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
bad = 0
for k in range(5):
    t = dur * (k + 0.5) / 5
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', p, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    g = np.frombuffer(raw, np.uint8).reshape(H, W).astype(float); n = H // 10
    top, bot = g[:n], g[-n:]
    barred = top.mean() < 8 and bot.mean() < 8 and top.std() < 2 and bot.std() < 2
    print(f'  t={t:5.1f}s top mean {top.mean():5.1f} sd {top.std():4.1f} | bottom mean {bot.mean():5.1f} sd {bot.std():4.1f} {"BLACK BARS" if barred else "ok"}')
    bad += barred
if bad: sys.exit(f'{p}: {bad} of 5 frames are letterboxed. Fix the framing in Descript and publish again before captioning.')
print(f'{p}: fills the frame')
