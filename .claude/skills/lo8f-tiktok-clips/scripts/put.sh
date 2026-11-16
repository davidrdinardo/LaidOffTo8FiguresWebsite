#!/bin/bash
# usage: put.sh <key> [workdir]
# Uploads <key>_tt.mp4 and <key>_yt.mp4 to their slots in uploads.txt (lines "<key>_tt <media_id> <presigned PUT url>", the last line for a name wins)
# and proves each one landed: the public link must answer with the same byte count as the local file.
# Request the slots (media_upload) only once the files exist and run this within minutes: an old slot answers 400. A slot works once.
cd "${2:-/home/user/shorts}"; K=$1; CDN=https://d2ol7oe51mr4n9.cloudfront.net/user_3CLxZGzAqms9f8ls8nQ54aDPtnw
for V in tt yt; do
  read ID UURL < <(grep "^${K}_${V} " uploads.txt | tail -1 | awk '{print $2, $3}')
  code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Content-Type: video/mp4" --data-binary @${K}_${V}.mp4 "$UURL" || true)
  size=$(stat -c %s ${K}_${V}.mp4)
  live=$(curl -sI "$CDN/$ID.mp4" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
  if [ "$code" = 200 ] && [ "$live" = "$size" ]; then echo "${K}_${V} OK $CDN/$ID.mp4"
  else echo "${K}_${V} FAILED (PUT $code, live size ${live:-none}, want $size): request a NEW slot, add its line to uploads.txt and run again"; fi
done
