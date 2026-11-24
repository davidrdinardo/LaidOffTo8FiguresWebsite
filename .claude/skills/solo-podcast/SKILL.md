---
name: "solo-podcast"
description: "Packages a SOLO episode of David DiNardo's 'Laid Off to 8 Figures' podcast (David alone, talking to camera, no guest) from raw recording to posted: the long-form edit in Descript with b-roll, purple concept cards, captions and music, the solo thumbnail in Higgsfield, first-person YouTube copy with chapters, three Shorts, the website transcript, and posting through Metricool after David approves. Use it whenever David names or uploads a recording where only he speaks, says 'solo episode', 'just me', 'I recorded one by myself', 'edit another video', or asks for the edit, a title, description, thumbnail, Shorts or anything else for an episode with no guest. For the Shorts themselves it hands over to the lo8f-tiktok-clips skill."
---

# Solo episode — raw recording to posted

This skill was rebuilt on Nov 16 2026 after the original vanished from David's account, from the two approved solo episodes (62 and 64). It ran end to end on episode 65 (Nov 16–18 2026) and was audited afterwards: every script and check named below was re-run against the episode 65 files on Nov 18. `references/recipe.md` holds the read-backs, the Underlord briefs, the message and copy templates and the longer procedures; read it before the first Underlord job. Two pieces could not be recovered and are marked there: the exact Spotify and LinkedIn wording rules.

**These files are public.** The repo is public on GitHub, and GitHub Pages serves the `.claude/` folder on laidoffto8figures.com (checked Nov 18 2026). Write nothing here that David would not want a stranger to read: no credentials, no private numbers, no name he asked to keep generic, no plans he has not announced.

## What David gets, in order

1. A plan he approves before anything is built.
2. The long-form edit ("YouTube – Full Edit"), loudness-corrected.
3. The thumbnail.
4. The copy file: YouTube title, description, chapters, tags; Shorts and Reel copy; Spotify and LinkedIn drafts.
5. Three Shorts of about 30 seconds (TikTok + YouTube pairs) — built with the `lo8f-tiktok-clips` skill.
6. Everything queued in Metricool as drafts, posted only after his yes.
7. The website transcript once the YouTube link exists, and a check that every post went out.

## Standing rules

- **David decides twice: the plan, and the posting.** He asked for both: "tell me what you are going to do before you start creating so I can approve it" (episode 64) and "I want to approve them before they go out" (Nov 16 2026). During episode 65 he also said several times "I don't want to have to approve each time", and he answered later questions with "you decide". (Claude's reading: two approvals per episode and no more. Between them, make the call, do the work and say what was decided.) The permission pop-ups in the app are a separate thing: they stop when the mode dropdown is set to Auto, and a cloud session cannot change that or write permission rules for itself.
- **Plan first.** One message, before anything is built or spent: the recording and its length, the episode number, the working title and thumbnail lines, each Short (topic, first and last words, planned length), the deliverables, the expected Descript credits (about 70 for the long-form, 15 per Short; episode 65 used 108 in all) and Higgsfield credits (5.5 for the thumbnail), and the questions only he can answer. After he approves it, don't ask again for routine steps.
- **Look for what he may not want named.** Read the transcript for other companies, people, deals in progress and money figures, and ask about them in the plan with a recommendation. On episode 65 the question was whether to name another company, and he chose not to.
- **Keep it generic when he says so.** That covers the title, description, thumbnail, tags, Shorts copy, the choice of Short segments (cut around the sentences that say the name) and the website transcript, where the name becomes a bracketed stand-in such as "[the company]" or "[name removed]". Make that replacement before the transcript's first commit: the repo is public and its history keeps every version (on episode 65 the first commit carried the name and a later one replaced it). The video itself still says and captions the name; tell him that.
- **Nothing is posted without his yes.** Drafts, links to watch, then live. One approval message covering every post is enough: on episode 65 he answered "yes post them at those times". Say in that message that the transcript will be pushed to the website, so his yes covers it.
- **Check the title and thumbnail against the recording.** The episode 65 working title said "Founder's Number"; the recording says the speaker was not the founder. Read the transcript for the facts a title claims.
- **Never edit the original composition.** Every Underlord call targets the new composition's id. Underlord edits the original by default; on episode 64 its first pass dropped music, captions and b-roll into the original and they had to be removed.
- **Working renders are private.** Pass `access_level: "private"` on every `publish_project` call. The download link works the same (tested Nov 18), and nothing is left on a share page. Left to the default, Descript publishes unlisted: the raw episode 65 recording sat on a share link for two days.
- **Solo means first person.** No guest block, no collaborator tag, no "X on Laid Off to 8 Figures". The clip tag reads "David DiNardo".
- **Thumbnails come from Higgsfield**, from his approved template. No other tool, no invented layout.
- **Nothing on a recurring schedule.** One-off scheduled posts and one-off check-ins only.
- **A recording that shows a screen is audited first.** Episode 67 was a screen-share demo: look at the picture and read every screen for private details before the plan is final, hide them in the source before Descript, and change the format (no punch-ins, b-roll only on camera, boxed captions over the screen, Shorts from the on-camera parts). The steps are in `references/recipe.md` under "Episode 67".
- **Sandbox calls end at 60 seconds.** Run anything longer with `background: true` and poll.
- **Expect the session to restart.** The worker restarted about eight times during episode 65. Descript jobs and sandbox background jobs keep running through a restart, so note every job id, composition id, media id and link as it appears, and after a restart check what finished (`wait_for_job`, the sandbox `.bg/*.log` files, `ls`) before starting anything again. A tool call that comes back with "did not run" may have run. A message from David that reappears word for word right after a restart may be a redelivery (Claude's guess: one message arrived about seven times); answer it once.

## Before you start

- **Tools.** The Descript, Higgsfield, Metricool and GitHub tools load on demand: `ToolSearch` with `select:<tool names>`. After every restart they have to be loaded again.
- **Waiting on Descript.** Call `wait_for_job` with `wait_seconds: 45` and repeat. The default wait dies at the connector's 60-second limit.
- **Sandbox.** The Higgsfield sandbox is wiped after about a day idle (it was empty again on Nov 18). In the repo run `bash .claude/skills/solo-podcast/scripts/sandbox_sync.sh` and run the one command it prints with `sandbox_exec` (timeout 120). It downloads these scripts and the clips scripts from GitHub at the checked-out commit, verifies each against this checkout's sha256 and runs `bootstrap.sh`: clips scripts land in `/home/user/skill/scripts`, solo scripts in `/home/user/skill/solo`. Push before running it. Work in `/home/user/ep<NN>`.
- **Free checks, while writing the plan.** `getBrandSettings` lists YouTube, TikTok and Instagram under `networksData` for brand 7590780. Higgsfield `balance` covers the thumbnail. The template still opens (`curl -sI` on its CloudFront link, in `references/recipe.md`, answers 200). Descript's credit balance cannot be read from here: add up `ai_credits_used` from every job and report the total.

## 0. Find the recording, read it, plan

- `search_drive` or `list_projects` (sort `created_at` or `updated_at`). Raw recordings are named like `David_Nov09_09-00-10_347de4af _i82y5k4j`; `get_project` gives the original composition id and duration. If the same recording exists twice, use the one David named and leave the other for him to delete.
- `export_transcript` (txt, `timecodes on_paragraphs`) of the ORIGINAL composition. Reading costs nothing and changes nothing, and it is all the plan needs.
- Episode number: `git fetch` the default branch, then the highest `num` in `episodes.json` plus one.
- Send the plan and stop until he answers. Nothing is published, edited or generated before that.

## 1. Analyse the raw file

- `publish_project` the ORIGINAL composition at 720p (private), download it in the sandbox as `raw.mp4`, then `python3 /home/user/skill/solo/analyze_raw.py raw.mp4`. It prints the side-camera stretches in source seconds, the zoom and pan for each camera, and the echo strength. A seven-minute file takes about 50 seconds and 300 MB. Keep the output; the Shorts need it.
- Check values. Episode 64: 6 hard cuts, stretches 70.03–74.37, 254.57–258.30, 381.27–384.07, front zoom 1.03, side 1.18. Episode 65: 0 hard cuts, front zoom 1.03, pan x −0.056, y −0.015.
- Not every recording has a second camera. Episode 65 was one camera throughout, and the script still listed two one-second "side-camera stretches" where David leaned back. When it prints the NOTE about no hard cuts, look at a frame from each stretch; if the room looks the same, use the front-camera framing for everything.
- Echo: under 0.15 is clean, over 0.3 is echo. Episode 65 measured 0.149 and 0.154 on two renders of the same recording, and David raised no complaint. Never cut a Short from a stretch the script flags.

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

Do it in two Underlord jobs with a look in between (33 and 23 credits on episode 65, plus 12 for a b-roll swap). Pass 1 took two minutes, pass 2 seven; a job far beyond that has stalled. Continue the same `conversation_id` for follow-ups on the same composition.

1. **Pass 1 — cleanup, sound, punch-ins, captions, music.** Create the new composition from the original first, then edit only inside it. Ask for a read-back of every setting. List the false starts you can see in the raw transcript word for word and say what each sentence should read afterwards; left to itself Underlord cut the real words "you're gonna" along with the stumble next to them (episode 65).
2. **Check render.** Publish at 720p, download it, run `bash /home/user/skill/solo/checksheets.sh pass1.mp4 /home/user/ep<NN>/check1` and look at `overview.jpg`: captions on every frame, white, no coloured box. `export_transcript` the NEW composition as `srt` and read it against the raw transcript for real words that went missing. Put any fix at the top of the pass 2 brief and tell Underlord to shift the later times by whatever the fix adds (restoring two words added 0.44 s). All b-roll and card times come from this SRT. Underlord places things at raw-recording times unless given times measured on the edited timeline; that misplaced the b-roll on episode 64.
3. **Cards.** Choose the moments (a literal noun being said: bullhorn for distribution, calendar for annual billing, robot for agents). `python3 /home/user/skill/solo/concept_cards.py /home/user/ep<NN>/cards <icon> <icon> ...`, `media_upload` each PNG, PUT, `media_confirm`, then `import_media` the CloudFront URLs into the project. David cut 31 cards down to 7 on episode 62: "too many and awkward".
4. **Pass 2 — b-roll and cards** at the measured times, by composition id, with the exact start time and duration of each. Keep b-roll and cards off the punch-in scenes. Say what kind of stock clip is wanted, not only the subject: horizontal 16:9 source, adults in a business setting, no children or teenagers, no dancing, and for a phone the screen must be visible. Underlord's own picks on episode 65 included a teenager dancing at a ring light and a vertical clip cropped down to a chin and the back of a phone; swapping the two cost another 12 credits.
5. **Verify by rendering, not by Underlord's word.** Publish at 1080p, download as `final.mp4`, then `bash /home/user/skill/solo/checksheets.sh final.mp4 /home/user/ep<NN>/check "<b-roll start times>" "<card start times>" "<a time inside two punch-ins and two plain scenes>"`. Look at all four sheets (they fit one `image_paths` call): every b-roll clip suits its words and the show, captions sit over the cards and b-roll (Underlord's first attempt put the new layers above the captions), the spoken word has no box, nothing is black or out of place. Underlord says itself that it cannot see its renders. Confirm with `get_project` that the original composition still has its old duration.
6. **Loudness.** The Descript export measured −21.6 LUFS on episodes 64 and 65, and YouTube does not turn quiet videos up. `python3 /home/user/skill/solo/loudnorm2.py final.mp4 lo8f-ep<NN>-full.mp4` measures, normalises in two passes with the picture copied untouched, and prints before and after (episode 65: −21.6 → −14.5 LUFS, peak −1.0 dBFS). A single loudnorm pass undershot to −15.6. Report the numbers.
7. **Upload the full file by streaming.** The usual `curl -X PUT --data-binary @file` answered HTTP 400 from Cloudflare for the 457 MB episode 65 file. With a new slot, `curl -H "Content-Type: video/mp4" -H "Expect:" -T lo8f-ep<NN>-full.mp4 '<upload_url>'` as a background command went through in a few minutes; check that the public link's content-length equals the local size, then `media_confirm`.

## 3. Thumbnail

`generate_image` with `model gpt_image_2_5`, `aspect_ratio 16:9`, `quality high`, `resolution 2k`, count 2, `use_unlim false`, and the template as the reference image: `medias: [{value: "f9d8d776-9ce1-41a8-90a3-43c2b7cc8644", role: "image"}]` (the server maps the role itself). Two variants cost 5.5 credits. The prompt is in `references/recipe.md`; change only the two text lines. Line 1 is bare white, line 2 sits on the red box; each line about 13 characters or fewer, all caps, together they say the episode's claim ("AI REPLACED" / "MY EDITOR", "DISTRIBUTION" / "IS THE MOAT", "THE TRICK" / "NO ONE DOES"). Then `python3 /home/user/skill/solo/thumb_finish.py <result url> lo8f-ep<NN>-thumbnail.jpg`, look at the preview through `image_paths`, read both lines letter by letter, pick the better of the two, `media_upload` the JPEG for `videoThumbnailUrl`.

The cloud container cannot download from the CloudFront or Metricool hosts, so the JPEG cannot be attached in chat: give David the CloudFront link on a line of its own, labelled "Thumbnail". On episode 65 it sat in a table row and he had to ask where it was.

## 4. Copy

Write one file, `lo8f-ep<NN>-copy.md`, and send it with `SendUserFile`. Formats and real examples are in `references/recipe.md`; episode 65's whole file is in `references/copy/`.

- **Title**: the hook, no guest name, under about 70 characters ("Distribution Is the Moat: 3 Things I Learned at SaaS North").
- **Description**: two first-person paragraphs, "⏱ Chapters", the fixed contact and Taxifi blocks, the disclaimer, five hashtags starting `#LaidOffTo8Figures #OttawaBusiness`. About 15 tags; category EDUCATION.
- **Chapters**: 10–14, timed from the SRT of the FINAL composition (after pass 2 and every fix, not the pass 1 SRT), first at 00:00, none shorter than 10 seconds, or YouTube shows no chapters at all.
- **Shorts and Reel copy**: see `lo8f-tiktok-clips`. The Reel is Short 1's YouTube render with the Reel caption format.
- **Spotify and LinkedIn**: drafts, labelled as drafts in the report (see the note in the reference file).
- **Keep it.** Once the posts are live, save the file as `references/copy/lo8f-ep<NN>-copy.md` with the real links and push it. The first skill's Spotify and LinkedIn wording was lost because no copy file was kept.

## 5. Shorts

Hand over to `lo8f-tiktok-clips`: three by default, more only if the length supports it. Every Short, Reel and TikTok runs about 30 seconds (David, Nov 18 2026); state the planned length of each in the plan. Give it the camera stretches and framing numbers from step 1. The cuts go in the same Descript project, one Underlord job at a time, and each can run while the previous one publishes; a single-piece Short took about a minute and 12–16 credits. Use `/home/user/ep<NN>/shorts` as the work folder (third argument of `finish.sh`, second of `put.sh`). Leave the "Full episode:" line out of the YouTube Shorts drafts until the link exists, so a placeholder can never go live.

## 6. Drafts, approval, posting (Metricool brand 7590780, America/Toronto)

- Create every draft before messaging him: the long-form (`youtubeData {title, type "video", privacy "public", tags, category "EDUCATION", madeForKids false}`, `media` = the CloudFront URL of the normalised file, `videoThumbnailUrl` = the thumbnail URL), a YouTube and a TikTok post per Short, and one Reel. Working request bodies are in `references/recipe.md`.
- Times that were accepted for episode 65: long-form 12:00 pm, Shorts at 5:00 pm and 8:00 pm the same day and 11:00 am the next (TikTok two minutes after each), Reel at 5:00 pm the next day. The `date` field needs Toronto's UTC offset for that date, which changes with daylight saving: `TZ=America/Toronto date -d '<date> <time>' +%:z`.
- Send David one approval message in the layout given in `references/recipe.md`: watch links, the thumbnail link on its own line, the copy file, the proposed times, what changed from the plan.
- On his yes, check the Toronto time, then set `draft: false` with `updateScheduledPost`, sending the full body and the `static.metricool.com` media and thumbnail URLs the create call returned. Metricool refuses a time in the past: if a slot has gone by, move it at least 8 minutes ahead and tell him. The same move answers "post that one now" (episode 65's Reel).
- Straight after releasing, schedule two one-off check-ins (`send_later` in a cloud session) and write every post uuid and id into their messages, because that may be all the context that survives: one about 20 minutes after the long-form time, one about 15 minutes after the last post.

## 7. After posting

**First check-in, once the long-form shows `PUBLISHED` in `getScheduledPosts`** (if it is still processing, wait and look again; never guess the id):
- From the sandbox, confirm what the public sees: `curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json"` returns the title, and `https://i.ytimg.com/vi/<id>/maxresdefault.jpg`, viewed through `image_paths`, is the custom thumbnail (it was on episode 65).
- Add `Full episode: https://youtu.be/<id>` to the YouTube Shorts that have not posted yet (`updateScheduledPost`, full body, ids fresh from `getScheduledPosts`). Leave TikTok and Instagram alone.
- Publish the transcript, following "Website transcript from a cloud session" in `references/recipe.md`. In short: replace any generic-only names first, commit `transcripts/<videoId>.json` in a separate worktree at the head of the default branch, push it there, then trigger the "Sync YouTube episodes" workflow so the page appears within a minute. The workflow's own schedule ran five hours after episode 65 went live. Confirm the live page from the sandbox with `curl`.

**Second check-in, after the last post:** every post shows `PUBLISHED` with a `publicUrl`. On episode 65 only the long-form had a check-in and the Shorts were confirmed a day later. If a post failed, report its `detailedStatus` and ask; recreating it blind risks a double post.

**Final report:** what is live with links, what is still scheduled, the loudness numbers, credits used, anything that failed, and the list only David can do: Spotify upload (give him the link to the loudness-fixed file, not the Descript export, and tell him to download it soon), LinkedIn post, pinned comment and "Related video" on each Short in YouTube Studio, Ottawa location and the "Comment EPISODE" auto-reply on the Reel, TikTok bio link, deleting any duplicate Descript project.

## 8. Changes after the drafts exist

- **A fix to the edit**: Underlord on the same composition (same `conversation_id`), publish again, `checksheets.sh`, `loudnorm2.py`, a NEW upload slot, then `updateScheduledPost` with the new CloudFront link as `media`. Metricool copied the old file when the draft was created, so the draft does not follow the file.
- **A change to the words**: `updateScheduledPost` with the full body. Update the copy file too.
- **After a post is live** Metricool cannot change it. Title, description and thumbnail changes are David's to make in YouTube Studio; say so instead of trying.

## Scripts

| Script | Where it runs | What it does |
|---|---|---|
| `sandbox_sync.sh` | repo checkout | Prints the one command that installs and verifies every script in the sandbox. |
| `analyze_raw.py` | sandbox | Camera switches, framing numbers for the Shorts, echo check on the raw recording. |
| `concept_cards.py` | sandbox | Purple concept cards from Font Awesome icon names. |
| `checksheets.sh` | sandbox | Time-stamped contact sheets of the edit: overview, b-roll, cards, other moments. |
| `loudnorm2.py` | sandbox | Two-pass loudness fix for the full episode, with before and after numbers. |
| `thumb_finish.py` | sandbox | Turns the Higgsfield result into the 1920×1080 JPEG and a preview. |

## Keeping this skill current

- A cloud session works on its own branch, and new sessions read the repo's default branch (`claude/laidoffto8figures-website-u7z4sl`; there is no `main`). A change that stays on the session branch is lost to every later session. On Nov 18 2026 David left the choice of direct push or pull request to Claude, and the updates went straight to the default branch. (Claude's reading: skill files may go straight there; anything that changes the site's pages is either covered by his posting yes or asked first.)
- Write down what an episode taught while it is fresh: what happened, on which episode and date, and the fix. Mark your own interpretations as yours, and quote David where his words set a rule.
- Re-run a script before trusting a change to it. Say so here when something is untested.
