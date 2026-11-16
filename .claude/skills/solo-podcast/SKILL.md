---
name: "solo-podcast"
description: "Packages a SOLO episode of David DiNardo's 'Laid Off to 8 Figures' podcast (David alone, talking to camera, no guest) from raw recording to posted: the long-form edit in Descript with b-roll, purple concept cards, captions and music, the solo thumbnail in Higgsfield, first-person YouTube copy with chapters, three Shorts, the website transcript, and posting through Metricool after David approves. Use it whenever David names or uploads a recording where only he speaks, says 'solo episode', 'just me', 'I recorded one by myself', 'edit another video', or asks for the edit, a title, description, thumbnail, Shorts or anything else for an episode with no guest. For the Shorts themselves it hands over to the lo8f-tiktok-clips skill."
---

# Solo episode — raw recording to posted

This skill was rebuilt on Nov 16 2026 after the original vanished from David's account. The long-form recipe, the thumbnail method and the copy formats were read back from the two approved solo episodes (62 and 64) in Descript, Higgsfield and Metricool, and the scripts were re-tested against episode 64. `references/recipe.md` holds those read-backs in full; read it before the first Underlord job. Two pieces could not be recovered and are marked there: the exact Spotify and LinkedIn wording rules.

## What David gets, in order

1. A plan he approves before anything is built.
2. The long-form edit ("YouTube – Full Edit"), loudness-corrected.
3. The thumbnail.
4. The copy file: YouTube title, description, chapters, tags; Shorts and Reel copy; Spotify and LinkedIn drafts.
5. Three Shorts (TikTok + YouTube pairs) — built with the `lo8f-tiktok-clips` skill.
6. Everything queued in Metricool as drafts, posted only after his yes.
7. The website transcript once the YouTube link exists (`lo8f-website-transcript` skill).

## Standing rules

- **Plan first.** He asked for it on episode 64: "tell me what you are going to do before you start creating so I can approve it". The plan names the recording, the episode number, the deliverables, the Short count the length supports (about one per minute) and the expected Descript credits (about 85 for the long-form, 20 per Short). After he approves the plan, don't ask again for routine steps; ask only for big changes.
- **Nothing is posted without his yes** (Nov 16 2026). Drafts, links to watch, then live.
- **Never edit the original composition.** Every Underlord call targets the new composition's id. Underlord edits the original by default; on episode 64 its first pass dropped music, captions and b-roll into the original and they had to be removed.
- **Solo means first person.** No guest block, no collaborator tag, no "X on Laid Off to 8 Figures". The clip tag reads "David DiNardo".
- **Thumbnails come from Higgsfield**, from his approved template. No other tool, no invented layout.
- **Nothing on a recurring schedule.** One-off scheduled posts only.

## 0. Find the recording and number the episode

- `search_drive` or `list_projects` (sort `updated_at`). Raw recordings are named like `David_Nov09_09-00-10_347de4af _i82y5k4j`; `get_project` gives the original composition id and duration. If the same recording exists twice, use the one David named and leave the other for him to delete.
- Episode number: the highest `num` in the repo's `episodes.json` plus one. State it in the plan.

## 1. Analyse the raw file

- `publish_project` the ORIGINAL composition at 720p. In the Higgsfield sandbox: paste the scripts (this skill's and `lo8f-tiktok-clips/scripts/`) with heredocs, compare `sha256sum` with the repo copies, run `bash bootstrap.sh`.
- `python3 analyze_raw.py raw.mp4` prints the side-camera stretches in source seconds, the zoom and pan for each camera, and the echo strength. Episode 64 check values: stretches 70.03–74.37, 254.57–258.30, 381.27–384.07; front zoom 1.03, side 1.18. Keep the output; the Shorts need it.
- `export_transcript` (txt, `timecodes on_paragraphs`) of the original for planning.

## 2. Long-form edit in Descript

Target, as read back from the approved episodes (details and per-clip tables in `references/recipe.md`):

| Element | Setting |
|---|---|
| Canvas | 1920×1080, new composition named "YouTube – Full Edit" |
| Cleanup | filler words, retakes and false starts removed; no silent gap of 0.8 s or longer left |
| Audio | Studio Sound on at 70; clip gain 100 % |
| Punch-ins | 1.15× with content position y +0.075 on short stretches (3–10 s) at emphasis moments, about one a minute, hard cuts |
| Captions | "Karaoke: Preview", Plus Jakarta Sans 600, 60 px, white, no box, no outline, black shadow blur 12, centred at (960, 864), whole video |
| Music | a lo-fi bed looped under the whole video at 4 % gain, no fades |
| B-roll | about 7 stock clips, 3–4 s each, muted, full-frame, hard cuts, each on the words that name what it shows |
| Purple cards | 3 s each, full-frame, at most one per minute, captions stay visible over them |
| Never | intro, outro, title cards, lower thirds, transitions |

Do it in two Underlord jobs with a look in between (about 46 and 37 credits):

1. **Pass 1 — cleanup, sound, punch-ins, captions, music.** Create the new composition from the original first, then edit only inside it. Ask for a read-back of every setting.
2. **Check render.** Publish at 720p, pull it into the sandbox, and `export_transcript` the NEW composition as `srt`. All b-roll and card times come from this SRT. Underlord places things at raw-recording times unless given times measured on the edited timeline; that misplaced the b-roll on episode 64.
3. **Cards.** Choose the moments (a literal noun being said: bullhorn for distribution, calendar for annual billing, robot for agents). `python3 concept_cards.py /home/user/cards <icon> <icon> ...`, `media_upload` each PNG, PUT, `media_confirm`, then `import_media` the CloudFront URLs into the project. David cut 31 cards down to 7 on episode 62: "too many and awkward".
4. **Pass 2 — b-roll and cards** at the measured times, by composition id, with the exact start time and duration of each.
5. **Verify by rendering, not by Underlord's word.** Publish at 1080p; in the sandbox build a contact sheet at one frame per 10 s plus full-size frames of two cards, two caption moments and every b-roll clip. Check each b-roll sits on its words. Confirm the original composition still has its old duration and no new layers.
6. **Loudness.** The Descript export measured −21.6 LUFS on episode 64 and YouTube does not turn quiet videos up. Normalise the published file: `ffmpeg -i full.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k full_norm.mp4`, confirm about −14 to −15 LUFS with `ebur128`, then `media_upload` that file. (Added Nov 16; tested on Shorts, first long-form use still to come. Report the before and after numbers.)

## 3. Thumbnail

`generate_image` with `model gpt_image_2_5`, `aspect_ratio 16:9`, `quality high`, `resolution 2k`, count 2, `use_unlim false`, and the template as the reference image: media id `f9d8d776-9ce1-41a8-90a3-43c2b7cc8644`. The prompt is in `references/recipe.md`; change only the two text lines. Line 1 is bare white, line 2 sits on the red box; each line about 13 characters or fewer, all caps, together they say the episode's claim ("AI REPLACED" / "MY EDITOR", "DISTRIBUTION" / "IS THE MOAT"). Then `python3 thumb_finish.py <rawUrl> lo8f-ep<NN>-thumbnail.jpg`, look at the preview through `image_paths`, read both lines letter by letter, pick the better of the two, `media_upload` the JPEG for `videoThumbnailUrl`.

## 4. Copy

Write one file, `lo8f-ep<NN>-copy.md`, and send it with `SendUserFile`. Formats and the two real examples are in `references/recipe.md`.

- **Title**: the hook, no guest name, under about 70 characters ("Distribution Is the Moat: 3 Things I Learned at SaaS North").
- **Description**: two first-person paragraphs, "⏱ Chapters" (10–14, from the edited SRT, first at 00:00), the fixed contact and Taxifi blocks, the disclaimer, five hashtags starting `#LaidOffTo8Figures #OttawaBusiness`. About 15 tags; category EDUCATION.
- **Shorts and Reel copy**: see `lo8f-tiktok-clips`.
- **Spotify and LinkedIn**: drafts, labelled as drafts in the report (see the note in the reference file).

## 5. Shorts

Hand over to `lo8f-tiktok-clips`: three by default, more only if the length supports it. Give it the camera stretches and framing numbers from step 1.

## 6. Approval, then posting (Metricool brand 7590780, America/Toronto)

- Long-form first: a draft YouTube post with `youtubeData {title, type "video", privacy "public", tags, category "EDUCATION", madeForKids false}`, `media` = the CloudFront URL of the normalised file, `videoThumbnailUrl` = the thumbnail URL.
- Send David one message with the watch links, the thumbnail, the copy file and the proposed times. On his yes, set `draft: false`.
- When `getScheduledPosts` shows the long-form as `PUBLISHED`, take its id, put `Full episode: https://youtu.be/<id>` into the Shorts descriptions, and release the Shorts drafts he approved.
- Then run `lo8f-website-transcript` with that video id. In a cloud session with this repo attached, the converter and the push run from the session itself (it worked for episodes 62 and 64).

## 7. Final report

What is live with links, what is scheduled, the loudness numbers, credits used, and the list only David can do: Spotify upload, LinkedIn post, pinned comment, "Related video" on each Short in YouTube Studio, Ottawa location on Reels, deleting any duplicate Descript project.
