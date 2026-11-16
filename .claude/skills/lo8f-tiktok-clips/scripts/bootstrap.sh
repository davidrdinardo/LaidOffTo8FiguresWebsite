#!/bin/bash
# usage: bash bootstrap.sh
# Run once at the start of every job. The Higgsfield sandbox is wiped after about a day idle, so never assume fonts, models or
# earlier scripts are still there. Fetches the Inter and Manrope fonts and the YuNet face model, and checks the tools the scripts need.
set -e; mkdir -p /home/user/fonts/inter /home/user/fonts/manrope /home/user/models /home/user/shorts
[ -f /home/user/fonts/inter/extras/ttf/Inter-Bold.ttf ] || { curl -sL -o /tmp/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip; unzip -q -o /tmp/inter.zip -d /home/user/fonts/inter; }
[ -s /home/user/fonts/manrope/Manrope.ttf ] || curl -sL -o /home/user/fonts/manrope/Manrope.ttf 'https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf'
[ -s /home/user/models/yunet.onnx ] || curl -sL -o /home/user/models/yunet.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
python3 - <<'PY'
from PIL import ImageFont
import cv2, faster_whisper, numpy
ImageFont.truetype('/home/user/fonts/inter/extras/ttf/Inter-Bold.ttf', 92)
f = ImageFont.truetype('/home/user/fonts/manrope/Manrope.ttf', 140); f.set_variation_by_axes([800])
cv2.FaceDetectorYN.create('/home/user/models/yunet.onnx', '', (540, 960), 0.6, 0.3, 5)
print('fonts, face model, opencv', cv2.__version__, 'and faster-whisper', faster_whisper.__version__, 'are ready')
PY
