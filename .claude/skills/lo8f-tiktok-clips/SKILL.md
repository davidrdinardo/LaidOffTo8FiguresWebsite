---
name: "lo8f-tiktok-clips"
description: "Cuts, styles, uploads and schedules vertical clips from a Laid Off to 8 Figures episode in the approved LO8F TikTok format (DOAC-style white-box uppercase hook title for the first 3 s, LO8F + speaker-name tag top-left for the whole clip, white one-word captions), plus the matching YouTube Shorts variant (white title with one red word) that also serves as the Instagram Reel. Use this whenever David asks for TikToks, Shorts, clips, reels, 'three more clips', 'post them to TikTok/YouTube', 'post the next one on Instagram', 'same format as last time', or wants a clip cover/thumbnail like Diary of a CEO, even if he doesn't say TikTok. Solo and guest episodes both use it for their Shorts."
---

# LO8F clips — the approved TikTok format (and the YouTube Shorts twin)

David approved this exact look on episode 63 (Craig Gauthier, Nov 1 2026): "the TikToks are perfect", and again on the nine solo Shorts of episode 64. Reproduce it, don't reinvent it. Every clip ships as a **pair** from one Descript cut: a TikTok render and a YouTube Shorts render that differ only in the 3-second hook title. Both carry the LO8F tag for the entire runtime. The YouTube render is also the Instagram Reel.

**Nothing goes out without David's yes.** He confirmed on Nov 16 2026: "I want to approve them before they go out." Every post is created as a draft, he gets the files to watch, and it goes live only after he approves. This holds for follow-up requests too ("three more", "post the next one").

## What a finished clip looks like

- 1080x1920, 30 fps, 30–50 s, one idea, ends on the punchline. No intro, no outro, no music.
- **0.0–3.0 s, hook title** burned into the picture (this is the thumbnail: TikTok uses frame 0, YouTube picks a frame from this window):
  - **TikTok**: 2–3 lines, each in its own white rounded box, black UPPERCASE Inter Bold 92 px, centred, lower third (`y_center 0.70`). Max ~19 characters per line or it overflows 1080 px.
  - **YouTube**: 3 short lines, white Inter Bold 118 px, one key word in red (232,35,35), soft blurred shadow, `y_center 0.72`. No boxes.
- **Whole clip, tag top-left** at (60,110): white pill "LO8F" (Inter ExtraBold 34) with the speaker's name under it (Inter SemiBold 24, white). Guest name normally; David's name when the clip is his story or the episode is solo. Both variants.
- **3.0 s → end, captions**: one word at a time, white Manrope 800, 140 px, upright, 14 px black outline, soft shadow, centred near (540, 1114). Never in a box, never italic, nothing under the hook. They are burned in by `scripts/captions.py`, not made in Descript (see "Things that went wrong").
- **Crop**: fills the frame, speaker's eyes near the horizontal centre and about 22 % from the top. The numbers differ per shoot; measure, don't assume.
- **Audio**: Studio Sound on at intensity 70 in Descript, then normalised to about −14 LUFS by `finish.sh`. Audio must come from a clean part of the recording (see echo).

`references/examples.md` has the hook lines that were approved, the framing numbers per episode and the list of things that went wrong once.

## Scripts

| Script | What it does |
|---|---|
| `bootstrap.sh` | Fetches the fonts and the face model into the sandbox and checks the tools. Run first, every job. |
| `hookstyle.py` | Draws the three overlays: TikTok hook, YouTube hook, LO8F tag. |
| `captions.py` | Times the words with faster-whisper, takes the spelling from your reference text, writes one PNG strip per word. |
| `framecheck.py` | Fails when a cut is letterboxed (black bars). |
| `finish.sh` | Runs framecheck and captions, burns captions + hook + tag, normalises loudness, builds the check sheets. Does not upload. |
| `put.sh` | Uploads both files and proves they landed. |
| `facecheck.py` | Reports where the face sits and whether it changes size (camera-angle switches). |

The Higgsfield sandbox cannot read this repo and is wiped after about a day idle. At the start of every job, write each script into `/home/user/skill/scripts/` with a heredoc (`cat > name <<'EOF'`), run `sha256sum` there and on the repo copies, and compare. Then `bash bootstrap.sh`.

## Pipeline

### 1. Plan every clip in one pass
- Get the transcript with timestamps (`export_transcript`, txt, `timecodes on_paragraphs`), or reuse the packaging session's `export.txt`. Read it; don't search keywords only.
- Map the WHOLE episode to candidate clips before cutting the first one, and tell David the ceiling. About one distinct clip per minute of a solo episode: the six-minute episode 64 gave six clean Shorts, and Shorts 7–9 had to reuse lines.
- Choose segments that stand alone: a contrarian claim, a number, a story with a last line. Check the Descript project's composition names ("Short N – title") and note which sentences each existing clip uses, so a new batch doesn't repeat them. If it must repeat, say so in the report.
- **Echo zones.** Some recordings carry room echo (autocorrelation peak at ~35–45 ms, strength > 0.3; clean is < 0.15). Never cut from a bad zone; David hears it instantly ("sounds like it echos"). Filtering doesn't fix it. Ep 63 bad zones: 180–630 s, ~1080 s, 5850 s to the end. `finish.sh` prints the echo strength of every cut.
- **Camera-angle switches.** David's solo recordings are one file that cuts to a wider side camera for a few seconds at a time. A clip that includes such a stretch needs a second framing for it (step 2).

### 2. Cut in Descript (Agent Underlord)
One agent job per project at a time; small single-clip jobs finish in 1–3 min, multi-clip prompts stall. A clip costs about 20 AI credits, a framing fix about 8; say the expected total before starting (credits ran out once on episode 63). Pass `client_model`. Prompt template (fill the quotes with the exact transcript words):

```
Build one new vertical Short in this project. Work ONLY inside a NEW composition that you create; never edit the original composition (<id>) or any existing composition. Every edit call must target the new composition's id.
New composition name: "Short N – <Title>". Canvas 1080x1920 (9:16), 30 fps.
Content: copy these pieces of the original recording into the new composition, in this order, joined with hard cuts:
Piece A — starts on the words "<first words>" and runs through "<last words>". (Skip "<lead-in to drop>": the Short must START on the word "<word>".)
Piece B — "<...>"
Cleanup inside the pieces only: remove filler words and false starts; shorten any pause of 0.6 s or longer to about 0.3 s. Do not cut any real words. Target length 30–45 s.
Framing: the camera video must FILL the whole 1080x1920 canvas, no black bars. On every clip: layer box 1080 × 1920 centred at (540, 960), fill mode, zoom <Z>x, pan x <PX>, y <PY>. (Or: copy the video layer's size, position, zoom and pan exactly from composition "<a Short that rendered correctly>" (<id>).)
Camera angle switch: between source media time <t0> s and <t1> s the picture cuts to a wider side camera. If any part of that range is inside this Short, split the clip exactly there (hard cuts) and on that piece ONLY use zoom <Z2>x, pan x <PX2>, y <PY2>. Tell me whether the range is in the Short and at what composition times.
Audio: Studio Sound on at 70%.
Do NOT add captions, titles, text layers, music, b-roll or transitions. Do not publish.
Report: the new composition id, final duration, first and last words of each piece as they now read, and confirmation from a rendered frame of every scene that it fills the canvas.
```
- Framing numbers in Descript's terms: pan = −(focal − 0.5) × scaled source size ÷ canvas size. Episode 64 (solo): front camera zoom 1.03, pan x −0.0814, y +0.0144; side camera zoom 1.19, pan x +0.2069, y +0.0571. Guest episodes: guest on the right of the wide frame → focal (0.55, 0.516); David on the left → (0.47, 0.50), scale 1.03. These hold only while the cameras and desk stay put: check with `facecheck.py` on the first cut of every new recording and adjust.
- Don't trust the report on framing. Episode 64 Shorts 5 and 6 rendered as a letterboxed strip while Underlord said the crop was applied. The fix that worked in one job: "copy the video layer's size, position, zoom and pan from <good Short> onto every clip in <these compositions>".
- `publish_project` 1080p → `download_url` (valid 24 h). One publish per project at a time; it normally takes a minute, occasionally ten. A publish can run while the next cut is being built.

### 3. Finish in the Higgsfield sandbox
Work in `/home/user/shorts`, scripts in `/home/user/skill/scripts`.
1. `python3 hookstyle.py s12 "Same Employees:|$20M Or $1 Billion?" "Same Employees.|$20M Or|$1 Billion?" "$1|Billion" "David DiNardo" /home/user/shorts` → `hook_s12_tt.png`, `hook_s12_yt.png`, `label_s12.png`. A TikTok line that is too wide stops with an error: split it.
2. Write `<key>_ref.txt`: the words of the cut exactly as spoken and as they should read on screen (take them from the transcript, apply the same skips you gave Underlord).
3. `bash finish.sh s12 '<descript download_url>' /home/user/shorts` with `background: true`; about 3 minutes a clip. It stops if the cut is letterboxed, if fewer than 80 % of the reference words are found in the audio, or if the loudness is outside −16.5 to −13 LUFS.
4. Look at `<key>_sheet.jpg` and `<key>_ytsheet.jpg` through `image_paths` (keep the total under 512 KiB): hook legible, tag present, captions white and upright with no box, first caption after 3.0 s, face not covered in the hook window. If the speaker's hand covers the face at 1 s (ep 63 Short 14), keep frame 0 for TikTok and set the YouTube cover offset to a clean frame. A clip that opens on the side camera (ep 64 Short 8) gets a YouTube cover offset after the angle change.
5. If the clip contains a side-camera stretch: `python3 facecheck.py <key>_raw.mp4 <t0> <t1>`. Size difference should be within about 5 %, eyes near the centre.
6. Only now request upload slots: `media_upload` with `files` for `<key>_tt.mp4` and `<key>_yt.mp4`; append lines `<key>_tt <media_id> <upload_url>` to `uploads.txt`; `bash put.sh <key>` within minutes. Slots are single-use, and slots requested hours earlier answer 400 even though the response says 24 h. `put.sh` prints OK only when the public link returns the same byte count as the local file.
7. `media_confirm` the ids. The public file is `https://d2ol7oe51mr4n9.cloudfront.net/user_3CLxZGzAqms9f8ls8nQ54aDPtnw/<media_id>.mp4`.

### 4. Drafts, approval, then live (Metricool brand 7590780, America/Toronto)
A cloud session can restart and lose hours mid-job (it cost eight on Nov 13). Metricool holds posts on its side, so finish and upload ALL files first, then create every post in one go.
- Create each post with `draft: true` at its intended time, a separate post per network. Pair times: TikTok two minutes after the YouTube Short. Spread clips across the day (for example 11:00, 17:00, 20:00), not minutes apart. There are no standing default times: propose them in the approval message.
- Send David one message: a table of clip, hook, length and proposed time, plus the link to each file (the CloudFront links open in a browser). If he wants the files in chat, see step 5.
- On his yes, flip each to `draft: false` with `updateScheduledPost`, keeping the full body. Updating changes the post `id`; the `uuid` stays. If the time has passed, move it at least 7 minutes ahead.
- TikTok: `providers [{"network":"tiktok"}]`, `tiktokData {privacyOption PUBLIC_TO_EVERYONE, title "<hook as a sentence>", autoAddMusic false, disableComment/Duet/Stitch false, photoCoverIndex 0}`. Text: the hook line, one or two plain sentences, "Full episode link in bio." (or "<Guest> on Laid Off to 8 Figures."), 5 hashtags (#entrepreneur #business #podcast + two topical).
- YouTube: `youtubeData {title "<Hook In Title Case>", type "short", privacy "public", category "EDUCATION", madeForKids false, tags [...]}`, `videoCoverMilliseconds 1000` (or the clean-frame offset). Text: two or three sentences in David's voice, blank line, `Full episode: <youtu.be link>`, blank line, `#LaidOffTo8Figures #OttawaBusiness ... #Shorts`.
- Instagram Reel: the YouTube file, `providers [{"network":"instagram"}]`, `instagramData {type "REEL", collaborators [], showReelOnFeed true}`, caption opening and closing with "Comment EPISODE …". One Reel per request unless he asks for more. Metricool cannot set the Ottawa location.
- After the scheduled time, confirm with `getScheduledPosts`. Report a link only when the status is `PUBLISHED` and there is a `publicUrl`: the id TikTok shows under `AWAITING_CONFIRMATION` is temporary and changes.

### 5. Show David the files in chat (when he asks for the file itself)
The cloud container cannot fetch cloudfront or Descript media hosts, only `storage.googleapis.com`. To deliver a file: `import_media` the cloudfront URL into a **new one-file Descript project** (one file per project — a multi-composition project publishes 50 kbps junk), `publish_project` 1080p, then in the sandbox `curl -s -D - -o /dev/null -r 0-0 "<download_url>"` and take the `location:` header, download that locally with curl, verify bitrate ≈ 10–12 Mbps, `SendUserFile` with `display: render`. Name files `lo8f-ep<NN>-short<N>-<slug>-{tiktok,youtube}.mp4`.

### 6. What only David can do (list it in the final report every time)
- YouTube Studio: set "Related video" on each Short to the full episode. Links in Shorts descriptions are not clickable, so this is the only tap-through.
- Instagram: add the Ottawa location; check that the "Comment EPISODE" auto-reply fires on Reels posted through Metricool.
- TikTok: the bio link should point at the episode or the site.
- Pinned comment on each Short.

## Reporting
A short table: clip, hook, length, TikTok time, YouTube time, and whether each is a draft or live. Mention which speaker name is on the tag, any lines reused from earlier clips, and the list from step 6.
