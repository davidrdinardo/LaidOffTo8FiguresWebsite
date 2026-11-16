#!/bin/bash
# usage: finish.sh <key> <descript download url | path to a local mp4> [workdir]
# Needs in workdir: hook_<key>_tt.png, hook_<key>_yt.png, label_<key>.png (from hookstyle.py) and <key>_ref.txt (the exact words spoken).
# The Descript cut must carry NO captions and NO text layers: this script adds the captions, the hook title and the tag.
# Produces <key>_tt.mp4 and <key>_yt.mp4 (captions from 3.0 s, hook over 0-3.0 s, tag for the whole clip, audio at about -14 LUFS),
# plus <key>_sheet.jpg and <key>_ytsheet.jpg. It does NOT upload: look at the sheets first, then run put.sh.
# Stops with an error when the cut is letterboxed, when the reference text does not match the audio, or when the loudness misses the target.
set -e; K=$1; SRC=$2; HERE="$(cd "$(dirname "$0")" && pwd)"; cd "${3:-/home/user/shorts}"
case "$SRC" in http*) curl -sL -o ${K}_raw.mp4 "$SRC";; *) [ "$SRC" -ef ${K}_raw.mp4 ] || cp "$SRC" ${K}_raw.mp4;; esac
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 ${K}_raw.mp4)
echo "raw $(stat -c %s ${K}_raw.mp4) bytes, $DUR s"
python3 "$HERE/framecheck.py" ${K}_raw.mp4
python3 "$HERE/captions.py" $K .
for V in tt yt; do
  ffmpeg -v error -y -i ${K}_raw.mp4 -f concat -safe 0 -i ${K}_caps.txt -i hook_${K}_${V}.png -i label_${K}.png \
    -filter_complex "[1:v]fps=30,format=rgba[c];[0:v][c]overlay=0:934:eof_action=pass[a];[a][2:v]overlay=0:0:enable='between(t,0,3.0)'[b];[b][3:v]overlay=0:0[v]" \
    -map "[v]" -map 0:a -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -t $DUR \
    -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart ${K}_${V}.mp4
  LUFS=$(ffmpeg -hide_banner -nostats -i ${K}_${V}.mp4 -vn -af ebur128 -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&$1=="I:"{print $2; exit}')
  echo "${K}_${V} $(stat -c %s ${K}_${V}.mp4) bytes, $(ffprobe -v error -show_entries format=duration -of csv=p=0 ${K}_${V}.mp4) s, $LUFS LUFS"
  python3 -c "import sys; v=float('$LUFS'); sys.exit(0 if -16.5 <= v <= -13 else 'loudness %s LUFS is outside -16.5..-13' % v)"
done
FR=""; for t in 0.0 1.0 2.5 3.4 8 14 22 30; do
  python3 -c "import sys; sys.exit(0 if $t < $DUR - 0.2 else 1)" || continue
  ffmpeg -v error -y -ss $t -i ${K}_tt.mp4 -frames:v 1 -vf scale=270:480 -q:v 5 ${K}_f$t.jpg; FR="$FR ${K}_f$t.jpg"; done
convert $FR +append -quality 72 ${K}_sheet.jpg
FR=""; for t in 0.0 1.0 2.5; do ffmpeg -v error -y -ss $t -i ${K}_yt.mp4 -frames:v 1 -vf scale=270:480 -q:v 5 ${K}_y$t.jpg; FR="$FR ${K}_y$t.jpg"; done
convert $FR +append -quality 72 ${K}_ytsheet.jpg
python3 - <<PY
import subprocess, numpy as np
sr=16000; raw=subprocess.run(['ffmpeg','-v','error','-i','${K}_raw.mp4','-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.float32)
for s in (5,20):
    seg=x[s*sr:(s+8)*sr]
    if len(seg)<sr*4: continue
    seg=seg-seg.mean(); n=len(seg); ml=int(sr*0.12)
    ac=np.correlate(seg,seg[:n-ml],mode='valid'); ac=ac/ac[0]; lags=np.arange(len(ac))/sr*1000; m=(lags>30)&(lags<90); i=np.argmax(ac[m])
    print('echo t=%d lag %.1f ms strength %.3f  (clean < 0.15, echo > 0.3)'%(s,lags[m][i],ac[m][i]))
PY
echo "FINISHED $K: view ${K}_sheet.jpg and ${K}_ytsheet.jpg, then put.sh $K"
