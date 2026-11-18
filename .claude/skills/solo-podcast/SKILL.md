---
name: "solo-podcast"
description: "Packages a SOLO episode of David DiNardo's 'Laid Off to 8 Figures' podcast (David alone, talking to camera, no guest) from raw recording to posted: the long-form edit in Descript with b-roll, purple concept cards, captions and music, the solo thumbnail in Higgsfield, first-person YouTube copy with chapters, three Shorts, the website transcript, and posting through Metricool after David approves. Use it whenever David names or uploads a recording where only he speaks, says 'solo episode', 'just me', 'I recorded one by myself', 'edit another video', or asks for the edit, a title, description, thumbnail, Shorts or anything else for an episode with no guest. For the Shorts themselves it hands over to the lo8f-tiktok-clips skill."
---

# Solo episode — raw recording to posted

This skill was rebuilt on Nov 16 2026 after the original vanished from David's account. The long-form recipe, the thumbnail method and the copy formats were read back from the two approved solo episodes (62 and 64) in Descript, Higgsfield and Metricool, and the scripts were re-tested against episode 64. It then ran end to end on episode 65 (Nov 16–17 2026), and what that run taught is folded in below. `references/recipe.md` holds the read-backs and the episode 65 notes in full; read it before the first Underlord job. Two pieces could not be recovered and are marked there: the exact Spotify and LinkedIn wording rules.

## What David gets, in order

1. A plan he approves before anything is built.
2. The long-form edit ("YouTube – Full Edit"), loudness-corrected.
3. The thumbnail.
4. The copy file: YouTube title, description, chapters, tags; Shorts and Reel copy; Spotify and LinkedIn drafts.
5. Three Shorts (TikTok + YouTube pairs) — built with the `lo8f-tiktok-clips` skill.
6. Everything queued in Metricool as drafts, posted only after his yes.
7. The website transcript once the YouTube link exists (`lo8f-website-transcript` skill).

## Standing rules

- **Plan first.** He asked for it on episode 64: "tell me what you are going to do before you start creating so I can approve it". The plan names the recording, the episode number, the deliverables, the Short count the length supports (about one per minute) and the expected Descript credits (about 70 for the long-form, 15 per Short: episode 65 used 68 including one b-roll swap, and 12–16 per Short). After he approves the plan, don't ask again for routine steps; ask only for big changes.
- **Nothing is posted without his yes** (Nov 16 2026). Drafts, links to watch, then live. On episode 65 he approved everything in one message ("yes post them at those times"), so one approval message covering every post is enough.
- **"I don't want to have to approve each time."** David sent this several times while episode 65 was being built. It was never established whether he meant the app's tool permission prompts or the review before posting; he approved the posts when asked. (My reading: the permission prompts.) Ask him once, in the plan, which he means. A cloud session cannot write `.claude/settings.json` permission rules for itself (the write was blocked); the mode dropdown set to Auto is what stops the prompts.
- **Keep it generic when he says so.** On episode 65 he asked that the partner company not be named. That covers the title, description, thumbnail, tags, Shorts copy and the choice of Short segments (cut around the sentences that say the name). The full episode still says and captions the name; tell him that. On the website transcript, which is searchable text, replace the name with a bracketed stand-in such as "[the company]" or "[name removed]" and keep the summary and takeaways generic (David left this call to Claude on Nov 18 2026, and this is what was done for episode 65).
- **Check the title and thumbnail against the recording.** The episode 65 working title said "Founder's Number"; the recording says the speaker was not the founder. Read the transcript for the facts a title claims.
- **Never edit the original composition.** Every Underlord call targets the new composition's id. Underlord edits the original by default; on episode 64 its first pass dropped music, captions and b-roll into the original and they had to be removed.
- **Solo means first person.** No guest block, no collaborator tag, no "X on Laid Off to 8 Figures". The clip tag reads "David DiNardo".
- **Thumbnails come from Higgsfield**, from his approved template. No other tool, no invented layout.
- **Nothing on a recurring schedule.** One-off scheduled posts only.
- **Expect the session to restart.** The worker restarted about eight times during episode 65. Descript jobs and sandbox background jobs keep running through a restart, so write down every job id, composition id, media id and download URL as it appears, and after a restart check what finished (`wait_for_job`, the sandbox `.bg/*.log` files, `ls`) before starting anything again. A sandbox call with `image_paths` returns no images when its command exits non-zero, so keep that command to something that cannot fail.

## 0. Find the recording and number the episode

- `search_drive` or `list_projects` (sort `updated_at`). Raw recordings are named like `David_Nov09_09-00-10_347de4af _i82y5k4j`; `get_project` gives the original composition id and duration. If the same recording exists twice, use the one David named and leave the other for him to delete.
- Episode number: the highest `num` in the repo's `episodes.json` plus one. State it in the plan.

## 1. Analyse the raw file

- `publish_project` the ORIGINAL composition at 720p. In the Higgsfield sandbox: paste the scripts (this skill's and `lo8f-tiktok-clips/scripts/`) with heredocs, compare `sha256sum` with the repo copies, run `bash bootstrap.sh`.
- `python3 analyze_raw.py raw.mp4` prints the side-camera stretches in source seconds, the zoom and pan for each camera, and the echo strength. Episode 64 check values: stretches 70.03–74.37, 254.57–258.30, 381.27–384.07; front zoom 1.03, side 1.18. Keep the output; the Shorts need it.
- Not every recording has a second camera. Episode 65 was one camera throughout: the script found 0 hard cuts and still listed two one-second "side-camera stretches" where David leaned back. When it prints the NOTE about no hard cuts, look at a frame from each stretch; if the room looks the same, use the front-camera framing for everything (episode 65: zoom 1.03, pan x −0.0567, y −0.0150).
- `export_transcript` (txt, `timecodes on_paragraphs`) of the original for planning.

## 2. Long-form edit in Descript

Target, as read back from the approved episodes (details and per-clip tables in `references/recipe.md`):

| Element | Setting |
|---|---|
| Canvas | 1920×1080, new composition named "YouTube – Full Edit" |
| Cleanup | filler words, retakes and false starts removed; no silent gap of 0.8 s or longer left |
| Audio | Studio Sound on at 70; clip gain 100 % |
| Punch-ins | 1.15× with content position y +0.075 on short stretches (3–10 s) at emphasis moments, about one a minute, hard cuts |
| Captions | "Karaoke: Preview", Plus Jakarta Sans 600, 60 px, white, no box, no outline, black shadow blur 12, centred at (960, 864), whole video. The style's active-word highlight box must be set to alpha 0: left alone it renders as a blue box behind the spoken word (episode 65) |
| Spelling | transcript text corrected in pass 1 so the captions read right: "Taxifi" (Descript hears "Taxify"), and any product or company name it mishears |
| Music | a lo-fi bed looped under the whole video at 4 % gain, no fades |
| B-roll | about 7 stock clips, 3–4 s each, muted, full-frame, hard cuts, each on the words that name what it shows |
| Purple cards | 3 s each, full-frame, at most one per minute, captions stay visible over them |
| Never | intro, outro, title cards, lower thirds, transitions |

Do it in two Underlord jobs with a look in between (33 and 23 credits on episode 65, plus 12 for a b-roll swap):

1. **Pass 1 — cleanup, sound, punch-ins, captions, music.** Create the new composition from the original first, then edit only inside it. Ask for a read-back of every setting. List the false starts you can see in the raw transcript word for word and say what each sentence should read afterwards; left to itself Underlord cut the real words "you're gonna" along with the stumble next to them (episode 65).
2. **Check render.** Publish at 720p, pull it into the sandbox, and `export_transcript` the NEW composition as `srt`. Read the SRT against the raw transcript for real words that went missing, and look at a caption frame for the blue box. Put any fix at the top of the pass 2 brief and tell Underlord to shift the later times by whatever the fix adds (restoring two words added 0.44 s). All b-roll and card times come from this SRT. Underlord places things at raw-recording times unless given times measured on the edited timeline; that misplaced the b-roll on episode 64.
3. **Cards.** Choose the moments (a literal noun being said: bullhorn for distribution, calendar for annual billing, robot for agents). `python3 concept_cards.py /home/user/cards <icon> <icon> ...`, `media_upload` each PNG, PUT, `media_confirm`, then `import_media` the CloudFront URLs into the project. David cut 31 cards down to 7 on episode 62: "too many and awkward".
4. **Pass 2 — b-roll and cards** at the measured times, by composition id, with the exact start time and duration of each. Keep b-roll and cards off the punch-in scenes. Say what kind of stock clip is wanted, not only the subject: horizontal 16:9 source, adults in a business setting, no children or teenagers, no dancing, and for a phone the screen must be visible. Underlord's own picks on episode 65 included a teenager dancing at a ring light and a vertical clip cropped down to a chin and the back of a phone; swapping the two cost another 12 credits.
5. **Verify by rendering, not by Underlord's word.** Publish at 1080p; in the sandbox build a contact sheet at one frame per 10 s plus full-size frames of every card, two caption moments and every b-roll clip. Check each b-roll sits on its words and suits the show, that captions sit over the cards and b-roll (the first attempt put the new layers above the captions), and that the active caption word has no box. Underlord says itself that it cannot see its renders. Confirm with `get_project` that the original composition still has its old duration.
6. **Loudness.** The Descript export measured −21.6 LUFS on episodes 64 and 65, and YouTube does not turn quiet videos up. `python3 loudnorm2.py final.mp4 lo8f-ep<NN>-full.mp4` measures, normalises in two passes with the picture copied untouched, and prints before and after (episode 65: −21.6 → −14.5 LUFS, peak −1.0 dBFS). A single loudnorm pass undershot to −15.6. Report the numbers.
7. **Upload the full file by streaming.** The usual `curl -X PUT --data-binary @file` answered HTTP 400 from Cloudflare for the 457 MB episode 65 file. With a new slot, `curl -H "Content-Type: video/mp4" -H "Expect:" -T lo8f-ep<NN>-full.mp4 '<upload_url>'` as a background command went through; check that the public link's content-length equals the local size, then `media_confirm`.

## 3. Thumbnail

`generate_image` with `model gpt_image_2_5`, `aspect_ratio 16:9`, `quality high`, `resolution 2k`, count 2, `use_unlim false`, and the template as the reference image: media id `f9d8d776-9ce1-41a8-90a3-43c2b7cc8644`. The prompt is in `references/recipe.md`; change only the two text lines. Line 1 is bare white, line 2 sits on the red box; each line about 13 characters or fewer, all caps, together they say the episode's claim ("AI REPLACED" / "MY EDITOR", "DISTRIBUTION" / "IS THE MOAT"). Then `python3 thumb_finish.py <rawUrl> lo8f-ep<NN>-thumbnail.jpg`, look at the preview through `image_paths`, read both lines letter by letter, pick the better of the two, `media_upload` the JPEG for `videoThumbnailUrl`. Pass the template as `medias: [{value: <id>, role: "image"}]`; the server maps the role itself. Both episode 65 variants came back spelled correctly ("THE TRICK" / "NO ONE DOES"). The cloud container cannot download from the CloudFront or Metricool hosts, so the JPEG cannot be attached in chat: give David the CloudFront link on a line of its own, labelled "Thumbnail". On episode 65 it sat in a table row and he had to ask where it was.

## 4. Copy

Write one file, `lo8f-ep<NN>-copy.md`, and send it with `SendUserFile`. Formats and the two real examples are in `references/recipe.md`.

- **Title**: the hook, no guest name, under about 70 characters ("Distribution Is the Moat: 3 Things I Learned at SaaS North").
- **Description**: two first-person paragraphs, "⏱ Chapters" (10–14, from the edited SRT, first at 00:00), the fixed contact and Taxifi blocks, the disclaimer, five hashtags starting `#LaidOffTo8Figures #OttawaBusiness`. About 15 tags; category EDUCATION.
- **Shorts and Reel copy**: see `lo8f-tiktok-clips`.
- **Spotify and LinkedIn**: drafts, labelled as drafts in the report (see the note in the reference file).

## 5. Shorts

Hand over to `lo8f-tiktok-clips`: three by default, more only if the length supports it. Give it the camera stretches and framing numbers from step 1. The cuts go in the same Descript project, one Underlord job at a time, and each can run while the previous one publishes; a single-piece Short took about a minute and 12–16 credits. Leave the "Full episode:" line out of the YouTube Shorts drafts until the link exists, so a placeholder can never go live.

## 6. Approval, then posting (Metricool brand 7590780, America/Toronto)

- Long-form first: a draft YouTube post with `youtubeData {title, type "video", privacy "public", tags, category "EDUCATION", madeForKids false}`, `media` = the CloudFront URL of the normalised file, `videoThumbnailUrl` = the thumbnail URL.
- Create every draft before messaging him: the long-form, a YouTube and a TikTok post per Short, and one Reel. Times that were accepted for episode 65: long-form 12:00 pm, Shorts at 5:00 pm and 8:00 pm the same day and 11:00 am the next (TikTok two minutes after each), Reel at 5:00 pm the next day.
- Send David one message with the watch links, the thumbnail link on its own line, the copy file and the proposed times. On his yes, set `draft: false` with `updateScheduledPost`, sending the full body and the `static.metricool.com` media and thumbnail URLs the create call returned. Check the Toronto time first; a time in the past is refused.
- If he approves everything at once, release everything, then schedule a one-off check-in for about 20 minutes after the long-form time (`send_later`, with the post uuids written into the message). At the check-in: when `getScheduledPosts` shows the long-form as `PUBLISHED`, take its id, add `Full episode: https://youtu.be/<id>` to the YouTube Shorts that have not posted yet, and go on to the transcript. Tell him the Shorts still post on time without that line if the session is not running.
- Then run `lo8f-website-transcript` with that video id. In a cloud session with this repo attached, the converter and the push run from the session itself (it worked for episodes 62 and 64).

## 7. Final report

What is live with links, what is scheduled, the loudness numbers, credits used, and the list only David can do: Spotify upload, LinkedIn post, pinned comment, "Related video" on each Short in YouTube Studio, Ottawa location on Reels, deleting any duplicate Descript project.
