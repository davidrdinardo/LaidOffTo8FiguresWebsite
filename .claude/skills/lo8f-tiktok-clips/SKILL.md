---
name: "lo8f-tiktok-clips"
description: "Cuts, styles, uploads and schedules vertical clips from a Laid Off to 8 Figures episode in the approved LO8F TikTok format (DOAC-style white-box uppercase hook title for the first 3 s, LO8F + speaker-name tag top-left for the whole clip, white one-word karaoke captions), plus the matching YouTube Shorts variant (white title with one red word). Use this whenever David asks for TikToks, Shorts, clips, reels, 'three more clips', 'post them to TikTok/YouTube', 'same format as last time', or wants a clip cover/thumbnail like Diary of a CEO, even if he doesn't say TikTok."
---

# LO8F clips — the approved TikTok format (and the YouTube Shorts twin)

David approved this exact look on episode 63 (Craig Gauthier, Nov 1 2026): "the TikToks are perfect". Reproduce it, don't reinvent it. Every clip ships as a **pair** from one Descript cut: a TikTok render and a YouTube Shorts render that differ only in the 3-second hook title. Both carry the LO8F tag for the entire runtime.

## What a finished clip looks like

- 1080x1920, 30 fps, 35–50 s, one idea, ends on the punchline. No intro, no outro, no music.
- **0.0–3.0 s, hook title** burned into the picture (this is the thumbnail: TikTok uses frame 0, YouTube picks a frame from this window):
  - **TikTok**: 2–3 lines, each in its own white rounded box, black UPPERCASE Inter Bold 92 px, centred, lower third (`y_center 0.70`). Max ~19 characters per line or it overflows 1080 px.
  - **YouTube**: 3 short lines, white Inter Bold 118 px, one key word in red (232,35,35), soft blurred shadow, `y_center 0.72`. No boxes.
- **Whole clip, tag top-left** at (60,110): white pill "LO8F" (Inter ExtraBold 34) with the speaker's name under it (Inter SemiBold 24, white). Guest name normally; David's name when the clip is his story. Both variants.
- **3.0 s → end, captions**: Descript "Karaoke: One word", restyled: white text including the active word, Manrope 800, 140 px, 14 px black outline (active word too), shadow 0/4 blur 12, background box alpha 0 AND highlight box alpha 0, centred at (540, 1114). No captions under the hook.
- **Crop**: static per speaker, content scale 1.03, fills the frame. Guest on the right of the wide frame → focal (0.55, 0.516); David on the left → (0.47, 0.50). Check one frame; the numbers differ per shoot.
- Studio Sound on, intensity 70. Audio must come from a clean part of the recording (see echo).

`scripts/hookstyle.py` draws the three PNG overlays, `scripts/finish.sh` composites, uploads and checks them. `references/examples.md` has the hook lines that were approved.

## Pipeline

### 1. Pick the moments
- Get the transcript with timestamps (`export_transcript`, txt, `timecodes on_paragraphs`), or reuse the packaging session's `export.txt`. Read it; don't search keywords only.
- Choose segments that stand alone: a contrarian claim, a number, a story with a last line. 35–50 s after cuts. Mix David and Craig-style guest moments. Don't reuse a moment already clipped (check the Descript project's composition names — they are "Short N – title").
- **Echo zones.** Some recordings carry room echo (autocorrelation peak at ~35–45 ms, strength > 0.3; clean is < 0.15). Scan the full source once (`echoscan` style: 8 s windows every 30 s) and never cut from a bad zone; David hears it instantly ("sounds like it echos"). Filtering doesn't fix it. Ep 63 bad zones: 180–630 s, ~1080 s, 5850 s to the end.

### 2. Cut in Descript (Agent Underlord)
One agent job per project at a time; small single-clip jobs finish in 1–3 min, multi-clip prompts stall. Prompt template (fill the quotes with the exact transcript words):

```
Build ONE new vertical Short in this project. Do NOT modify, rename or delete any existing composition (never edit <full-episode ids>); create the new composition FIRST and make every edit inside it only. Copy the piece from "<full episode composition name>" (<id>), whose timeline matches the source file. New composition: 1080x1920, 30 fps, named "Short N – <Title>". <Who is on camera>.
STEP 1 — Create the composition and paste the piece, source timecodes about HH:MM:SS to HH:MM:SS. Start on "<first words>". Include "<kept passage>". Then CUT "<dropped passage>". Resume on "<...>". End on "<last words>". Cut David's interjections ("Yeah", "Right") and fillers ("um", "uh", "you know", "like" as filler); cut false starts and immediate repeats keeping the last instance. Studio Sound on at intensity 70. Target 40–50 s.
STEP 2 — Crop: one static crop, content scale 1.03, focal point x 0.55, y 0.516, video layer fills the full 1080x1920 frame with no black bars. (Two speakers: give both focal points and say "switch only at the cut between speakers".)
STEP 3 — Captions from 3.0 s to the end using Descript's built-in captions added as ONE bulk operation, "Karaoke: One word" style, restyled: background box fully transparent (alpha 0) AND highlight box colour fully transparent (alpha 0); white text (255,255,255) including the active word; Manrope 800, not italic, 140 px; 14 px black outline on the active word as well; shadow black offset 0/4 blur 12; centred at x 540 and y 1114. NO captions in the first 3.0 s. Re-query the caption track afterwards and report the actual values.
STEP 4 — Do NOT add any hook title or other text layers.
Report the composition id, final duration and what was cut. Do not publish.
```
- Read the agent's report. If the highlight box is not alpha 0 or the outline is 0, send the one-paragraph restyle prompt (same values, "exactly as was done on Short N-1") targeted at that composition — it has worked every time. If the crop "didn't read back", ask it to set the focal point again.
- `publish_project` 1080p unlisted → `download_url`. Publishes can run while the next cut is being built.

### 3. Hook overlays + composite (Higgsfield sandbox)
- Inter fonts: `/home/user/fonts/inter/extras/ttf/`. If missing: `curl -L -o /tmp/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip && mkdir -p /home/user/fonts/inter && unzip -q /tmp/inter.zip -d /home/user/fonts/inter`.
- `python3 hookstyle.py s12 "Same Employees:|$20M Or $1 Billion?" "Same Employees.|$20M Or|$1 Billion?" "$1|Billion" "David DiNardo" /home/user/shorts` → `hook_s12_tt.png`, `hook_s12_yt.png`, `label_s12.png`. Preview the hook over a real frame before rendering (crop a frame from the source with the same focal point, overlay, view with `image_paths`).
- Request upload slots **before** rendering: `media_upload` with `files` for `<key>_tt.mp4` and `<key>_yt.mp4`; write `uploads.txt` lines `<key>_tt <media_id> <upload_url>`. Presigned URLs are single-use and a 400 means get a fresh one.
- `bash finish.sh s12 '<descript download_url>' /home/user/shorts` in the background (use `size: "xl"` for three clips). It downloads the raw cut, burns hook (0–3 s) + tag (whole clip), PUTs both files, writes `<key>_sheet.jpg` and prints echo strength. View the sheet: hook legible, tag present, captions white with no box, echo < 0.15.
- Check the hook window frames (0, 1.0, 2.5 s). If the speaker's hand covers the face at 1 s (ep 63 Short 14), keep frame 0 for TikTok and set the YouTube cover offset to a clean frame.
- `media_confirm` the ids. The public file is `https://d2ol7oe51mr4n9.cloudfront.net/user_3CLxZGzAqms9f8ls8nQ54aDPtnw/<media_id>.mp4`.

### 4. Schedule in Metricool (brand 7590780, America/Toronto)
Create every post as `draft: true` first, send David the files, and flip `draft: false` with `updateScheduledPost` only after he approves (he asked to see them first; a draft keeps its slot). Pair times: TikTok one minute after the YouTube Short (10:00/10:01, 10:05/10:06, 10:10/10:11).
- TikTok: `providers [{"network":"tiktok"}]`, `tiktokData {privacyOption PUBLIC_TO_EVERYONE, title "<hook as a sentence>", autoAddMusic false, isAigc false, disableComment/Duet/Stitch false, photoCoverIndex 0}`. Text: one or two plain sentences, "Craig Gauthier on Laid Off to 8 Figures.", 4–5 hashtags (#entrepreneur #business #podcast + two topical).
- YouTube: `youtubeData {title "<Hook In Title Case>", type "short", privacy "public", category "EDUCATION", madeForKids false, isAiGeneratedContent false, tags [...]}`, `videoCoverMilliseconds 1000` (or the clean-frame offset). Text: two or three sentences, blank line, `Full episode: <youtu.be link>`, blank line, `#LaidOffTo8Figures ... #Shorts`.
- Updating a post changes its `id`; the `uuid` stays. Keep the full body on every update.

### 5. Show David the files
The cloud container cannot fetch cloudfront or Descript media hosts, only `storage.googleapis.com`. To deliver a file: `import_media` the cloudfront URL into a **new one-file Descript project** (one file per project — a multi-composition project publishes 50 kbps junk), `publish_project` 1080p, then in the sandbox `curl -s -D - -o /dev/null -r 0-0 "<download_url>"` and take the `location:` header, download that locally with curl, verify bitrate ≈ 10–12 Mbps, `SendUserFile` with `display: render`. Name files `lo8f-ep<NN>-short<N>-<slug>-{tiktok,youtube}.mp4`.

## Reporting
A short table: clip, hook, TikTok time, YouTube time, and whether they are drafts or live. Mention which speaker name is on the tag. Remind him of anything left on his side (deleting a bad post, approving the YouTube drafts).
