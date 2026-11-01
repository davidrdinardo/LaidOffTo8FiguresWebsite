#!/bin/bash
# usage: finish.sh <key> <descript download url> [workdir]
# Needs in workdir: hook_<key>_tt.png, hook_<key>_yt.png, label_<key>.png, uploads.txt (lines: "<key>_tt <media_id> <presigned PUT url>" and "<key>_yt ...")
# Produces <key>_tt.mp4 and <key>_yt.mp4 (hook over 0-3.0 s, label for the whole clip), uploads them, prints echo strength, builds <key>_sheet.jpg
set -e; K=$1; URL=$2; cd "${3:-/home/user/shorts}"
curl -sL -o ${K}_raw.mp4 "$URL"
echo "raw $(stat -c %s ${K}_raw.mp4) bytes dur $(ffprobe -v error -show_entries format=duration -of csv=p=0 ${K}_raw.mp4)"
for V in tt yt; do
  ffmpeg -v error -y -i ${K}_raw.mp4 -i hook_${K}_${V}.png -i label_${K}.png \
    -filter_complex "[0:v][1:v]overlay=0:0:enable='between(t,0,3.0)'[a];[a][2:v]overlay=0:0[v]" \
    -map "[v]" -map 0:a -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart ${K}_${V}.mp4
  read ID UURL < <(grep "^${K}_${V} " uploads.txt | awk '{print $2, $3}')
  code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Content-Type: video/mp4" --data-binary @${K}_${V}.mp4 "$UURL")
  echo "${K}_${V} upload $code id $ID"   # anything but 200: request a NEW presigned url (they are single-use) and PUT again
done
for t in 0.0 1.0 2.5 12 25; do ffmpeg -v error -y -ss $t -i ${K}_tt.mp4 -frames:v 1 -vf scale=270:480 -q:v 6 ${K}_f$t.jpg; done
convert ${K}_f0.0.jpg ${K}_f1.0.jpg ${K}_f2.5.jpg ${K}_f12.jpg ${K}_f25.jpg +append -quality 70 ${K}_sheet.jpg
python3 - <<PY
import subprocess, numpy as np
sr=16000; raw=subprocess.run(['ffmpeg','-v','error','-i','${K}_tt.mp4','-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.float32)
for s in (5,20):
    seg=x[s*sr:(s+8)*sr]
    if len(seg)<sr*4: continue
    seg=seg-seg.mean(); n=len(seg); ml=int(sr*0.12)
    ac=np.correlate(seg,seg[:n-ml],mode='valid'); ac=ac/ac[0]; lags=np.arange(len(ac))/sr*1000; m=(lags>30)&(lags<90); i=np.argmax(ac[m])
    print('echo t=%d lag %.1f ms strength %.3f  (clean < 0.15, echo > 0.3)'%(s,lags[m][i],ac[m][i]))
PY
echo FINISHED
