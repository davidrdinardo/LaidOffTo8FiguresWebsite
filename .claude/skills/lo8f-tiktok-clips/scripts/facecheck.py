"""Where is the speaker's face, and does it stay the same size? Run on a vertical render (the no-caption cut or a finished file).

usage: python3 facecheck.py <file.mp4> [t0 t1]     (t0 t1 = optional window in seconds to report on its own, e.g. a side-camera stretch)
Prints the eye line (x, y as % of the frame) and the eye-to-mouth distance (% of frame height) overall, per 4 s block, and for the window.
The eye-to-mouth distance should stay within about 5 % across the clip; a block that drops 10-15 % is a wider camera angle that needs its own framing.
"""
import cv2, sys, subprocess, numpy as np
p = sys.argv[1]; win = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else None
det = cv2.FaceDetectorYN.create('/home/user/models/yunet.onnx', '', (540, 960), 0.6, 0.3, 5)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', 'fps=5,scale=540:960', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
n = len(raw) // (540 * 960 * 3); rows = []
for i in range(n):
    _, fc = det.detect(np.frombuffer(raw[i * 540 * 960 * 3:(i + 1) * 540 * 960 * 3], np.uint8).reshape(960, 540, 3))
    if fc is None: continue
    r = max(fc, key=lambda r: r[2] * r[3])
    rows.append((i / 5, (r[4] + r[6]) / 2 / 5.4, (r[5] + r[7]) / 2 / 9.6, ((r[11] + r[13]) / 2 - (r[5] + r[7]) / 2) / 9.6))
a = np.array(rows)
if not len(a): sys.exit('no face found')
def line(name, c): print('%s eyes (%.1f, %.1f)  eye-to-mouth %.2f  n=%d' % (name, np.median(c[:, 1]), np.median(c[:, 2]), np.median(c[:, 3]), len(c)))
line('whole clip  ', a)
for t0 in np.arange(0, a[:, 0].max(), 4.0):
    c = a[(a[:, 0] >= t0) & (a[:, 0] < t0 + 4)]
    if len(c): line('  %4.0f-%4.0fs' % (t0, t0 + 4), c)
if win:
    c = a[(a[:, 0] >= win[0]) & (a[:, 0] <= win[1])]; o = a[(a[:, 0] < win[0]) | (a[:, 0] > win[1])]
    if len(c) and len(o):
        line('window      ', c); line('rest of clip', o)
        print('size difference %.1f %%' % (100 * (np.median(c[:, 3]) / np.median(o[:, 3]) - 1)))
