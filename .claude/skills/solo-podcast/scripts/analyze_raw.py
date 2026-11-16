"""Map a raw solo recording before choosing clips: camera switches, framing numbers for Descript, and echo.

usage: python3 analyze_raw.py <raw.mp4>
<raw.mp4> is the ORIGINAL composition published from Descript (720p is enough).
David's solo recordings are one pre-switched file: a front camera with short cutaways to a wider side camera. Underlord cannot see the switch.
Prints (1) every side-camera stretch in source seconds, (2) for each camera the framing to give Underlord for a 1080x1920 Short
(zoom, pan x, pan y for a layer box of 1080 x 1920 centred at 540, 960), (3) the echo strength every 30 s.
Framing rule (from the approved episode 64 Shorts): eye-to-mouth distance (measured on the raw frame) scales to 10.4 % of the frame height, and the eye line sits 21.9 % from the top.
"""
import sys, subprocess, re
import numpy as np, cv2
p = sys.argv[1]; FPS, W, H = 4, 640, 360
det = cv2.FaceDetectorYN.create('/home/user/models/yunet.onnx', '', (W, H), 0.6, 0.3, 5)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', f'fps={FPS},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
n = len(raw) // (W * H * 3); rows = []
for i in range(n):
    _, fc = det.detect(np.frombuffer(raw[i * W * H * 3:(i + 1) * W * H * 3], np.uint8).reshape(H, W, 3))
    if fc is None: rows.append((i / FPS, np.nan, np.nan, np.nan, np.nan)); continue
    r = max(fc, key=lambda r: r[2] * r[3])
    rows.append((i / FPS, r[3] / H, (r[4] + r[6]) / 2 / W, (r[5] + r[7]) / 2 / H, ((r[11] + r[13]) / 2 - (r[5] + r[7]) / 2) / H))
a = np.array(rows); dur = n / FPS
h0 = np.nanmedian(a[:, 1])
side = np.nan_to_num(a[:, 1], nan=h0) < 0.93 * h0          # wider camera = smaller face
for i in range(2, n - 2):                                   # drop one-sample blips, fill one-sample holes
    if side[i] and not side[i - 1] and not side[i + 1]: side[i] = False
    if not side[i] and side[i - 1] and side[i + 1]: side[i] = True
cuts = [float(m) for m in re.findall(r'pts_time:([0-9.]+)', subprocess.run(
    ['ffmpeg', '-hide_banner', '-i', p, '-vf', "scale=320:180,select='gt(scene,0.2)',showinfo", '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr)]
def snap(t):
    near = [c for c in cuts if abs(c - t) <= 0.6]
    return min(near, key=lambda c: abs(c - t)) if near else t
wins, i = [], 0
while i < n:
    if side[i]:
        j = i
        while j < n and side[j]: j += 1
        if j - i >= FPS: wins.append((snap(i / FPS), snap(j / FPS)))
        i = j
    else: i += 1
print(f'{p}: {dur:.1f} s, {len(cuts)} hard cuts found, face found in {100 * np.isfinite(a[:, 1]).mean():.0f} % of frames')
print(f'side-camera stretches (source seconds): {", ".join(f"{s:.2f}-{e:.2f}" for s, e in wins) or "none"}')
inwin = np.zeros(n, bool)
for s, e in wins: inwin |= (a[:, 0] >= s) & (a[:, 0] < e)
def framing(name, m):
    c = a[m & np.isfinite(a[:, 1])]
    if len(c) < 3: return
    fh, ex, ey, em = np.median(c[:, 1]), np.median(c[:, 2]), np.median(c[:, 3]), np.median(c[:, 4])
    z = max(1.0, round(0.104 / em, 2))
    fx = min(max(ex, 0.1582 / z), 1 - 0.1582 / z); fy = min(max(ey + 0.281 / z, 0.5 / z), 1 - 0.5 / z)
    print(f'{name}: face height {fh:.3f}, eye-to-mouth {em:.4f}, eyes ({ex:.3f}, {ey:.3f})  ->  zoom {z:.2f}, pan x {-(fx - 0.5) * 3.1605 * z:+.4f}, y {-(fy - 0.5) * z:+.4f}   (focal {fx:.3f}, {fy:.3f})')
framing('front camera', ~inwin); framing('side camera ', inwin)
sr = 16000; x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
worst = 0
for s in range(5, int(len(x) / sr) - 8, 30):
    seg = x[s * sr:(s + 8) * sr]; seg = seg - seg.mean(); ml = int(sr * 0.12)
    ac = np.correlate(seg, seg[:len(seg) - ml], mode='valid')
    if ac[0] <= 0: continue
    ac = ac / ac[0]; lags = np.arange(len(ac)) / sr * 1000; m = (lags > 30) & (lags < 90); v = ac[m].max(); worst = max(worst, v)
    if v > 0.3: print(f'ECHO at {s}-{s + 8} s: strength {v:.2f}. Do not cut clips from here.')
print(f'echo: worst strength {worst:.3f} (clean under 0.15, echo over 0.3)')
