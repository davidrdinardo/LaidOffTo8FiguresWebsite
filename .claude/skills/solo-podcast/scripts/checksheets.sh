#!/bin/bash
# usage: checksheets.sh <video.mp4> <outdir> "<b-roll start times>" "<card start times>" ["<other times>"]
#   e.g. checksheets.sh final.mp4 /home/user/ep65/check "8.6 35.6 51.7 118.4 141.54 174.84 352.34" "81.7 128.5 201.24 253.24 310.44" "33 229"
# Builds the pictures to look at before the long-form edit goes to David. Times are seconds on the edited timeline.
#   overview.jpg  one frame every 10 s of the whole video (every 15 s or more for a long one), each stamped with its time
#   broll.jpg     one frame 2 s into every b-roll clip
#   cards.jpg     one frame 1.5 s into every card
#   other.jpg     one frame at each extra time given (punch-ins, caption moments)
# What to check on them: every b-roll clip suits the words and the show, captions are visible over b-roll and cards,
# the spoken word has no coloured box behind it, and the overview has no black frames or surprises.
# Each sheet stays near or under 200 KB, so two or three fit in one image_paths call (512 KiB in total).
set -e
V=$1; O=$2; mkdir -p "$O"
FONT=""; for f in /home/user/fonts/inter/extras/ttf/Inter-Bold.ttf /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf; do [ -f "$f" ] && FONT=$f && break; done
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
STEP=$(python3 -c "import math; print(max(10, math.ceil($D / 48 / 5) * 5))")
stamp() { [ -n "$FONT" ] && echo ",drawtext=fontfile=$FONT:text='$1':x=8:y=8:fontsize=$2:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4" || true; }
sheet() { # sheet <name> <offset s> <columns> <frame width> <frame height> <times...>
  local name=$1 off=$2 cols=$3 w=$4 h=$5; shift 5; [ $# -gt 0 ] || return 0
  rm -f "$O"/.f_*.jpg; local i=0 t ts
  for t in "$@"; do
    ts=$(python3 -c "print(max(0, min($t + $off, $D - 0.2)))")
    ffmpeg -v error -y -ss "$ts" -i "$V" -frames:v 1 -vf "scale=$w:$h$(stamp "${t}s" $((h / 12)))" -q:v 4 "$O/.f_$(printf %03d $i).jpg"; i=$((i + 1))
  done
  ffmpeg -v error -y -framerate 1 -i "$O/.f_%03d.jpg" -vf "tile=${cols}x$(( (i + cols - 1) / cols ))" -frames:v 1 -q:v 5 "$O/$name.jpg"; rm -f "$O"/.f_*.jpg
}
sheet overview 0 8 240 135 $(python3 -c "print(' '.join(str(t) for t in range(0, int($D), $STEP)))")
sheet broll 2 4 480 270 $3
sheet cards 1.5 3 480 270 $4
sheet other 0 4 480 270 $5
echo "duration $D s, overview every $STEP s"; ls -la "$O"/*.jpg
