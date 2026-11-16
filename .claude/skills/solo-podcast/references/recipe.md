# Solo episode reference: what the two approved episodes actually contain

Read back on Nov 16 2026 from Descript (Underlord, read-only), Higgsfield (generation history) and Metricool (published posts). David's words on episode 62 after the purple cards were cut to seven: "love it save that skill nailed it for the long solo videos."

## Contents
- Reference projects
- Long-form read-back, episode 64
- Long-form read-back, episode 62
- Underlord briefs (pass 1, pass 2, read-only inspection)
- Thumbnail prompt
- YouTube copy: template and both real examples
- Instagram Reel caption
- Spotify and LinkedIn (not recovered)

## Reference projects

| Episode | Descript project | Original composition | "YouTube – Full Edit" | YouTube |
|---|---|---|---|---|
| 62, AI Replaced My Video Editor | `08a5b7b2-5d28-49d8-83a3-aa535ae3dd4b` | not recorded | `3df829ed-0066-49e3-8c40-84ac62370211` | `1US5vG2L704` |
| 64, Distribution Is the Moat | `fb86c46c-cc38-4412-98f4-17c202b8dd93` | `30e41d43-ef82-414e-a24e-1b29cd2eb10a` | `70a551b3-763d-490e-ae58-6cd494798e48` | `LpdIjUUYm44` |

When a setting is in doubt, ask Underlord to read it from one of these compositions (the read-only prompt below costs about 6–8 credits) and copy it.

## Long-form read-back, episode 64 (6:28 raw → 6:01 edit)

- 1920×1080, 360.87 s, 12 scenes, hard cuts only, no intro or outro, no title or text layers.
- Camera: full-frame at scale 1.0; punch-in 1.15× with content position (0, 0.075) on scenes 2, 4, 6, 8, 10, 12: 46.5–51.6, 58.2–68.2, 144–150.9, 220.8–224.7, 300.5–303.7, 356.84–end. Studio Sound 70. Gain 100 %.
- Captions: track "Karaoke: Preview", Plus Jakarta Sans 600, 60 px, white (active word also white; upcoming words render dimmer), background fully transparent, outline 0, shadow black blur 12, centre (960, 864), box 1697.85 × 135.59 (two lines), 0 to end.
- Music: "Lo-Fi Chill Music", 0 to end, looped, gain 0.04 (4 %), no fades, no ducking.
- B-roll, 7 clips, 4 s each, muted, full-frame, no transitions:

| Clip | Start | What was being said |
|---|---|---|
| Conference speaker | 2.68 | "I went to SaaS North last week" |
| Phone on tripod | 25.09 | "get in front of camera" |
| Websites on monitor | 70.8 | "she showed five websites" |
| Email inbox | 120.5 | "bombarded with emails" |
| Contract handshake | 193.5 | "long-term contract" |
| Message notification | 225 | "connects to your Slack channel, your Gmail" |
| Social feed scrolling | 311 | "post it on LinkedIn" |

- Purple cards, 5, each 3 s, full-frame: `card-01-bullhorn` 38.42, `card-02-calendar-days` 156.63, `card-03-robot` 208.2, `card-04-trophy` 253.9, `card-05-calculator` 296.36.
- The published file measured −21.6 LUFS, peak −1.8 dBFS.

## Long-form read-back, episode 62 (7:04 edit)

- 1920×1080, 424.92 s, 15 scenes, hard cuts only, no intro or outro.
- Camera: punch-in 1.15× with position y +0.0575 on the even scenes: 29.3–35.33, 118.2–128, 154.93–163, 183.07–188.3, 221.72–223.17, 343.16–350.5, 404.32–410.66. Studio Sound 100. Ducking 0.5 on the camera track.
- Captions: identical to episode 64.
- Music: "Lofi bed", looped, gain 0.08 with the 0.5 ducking (so the same effective level as episode 64's 4 %).
- B-roll, 7 clips, 3–3.5 s: scrolling 4.0, editor timeline 14.0, cash 127.9, late night 163.0, papers 176.5, watch 289.0, freelancer 373.8.
- Purple cards, 7 (cut down from 31), each 3 s: microchip 25.75, calculator 109.97, road-barrier 151.93, users 209.43, flag 269.55, people-group 358.06, chart-line 410.66. The file names keep their original numbers (`card-04-…`, `card-31-…`).

Use the episode 64 values (Studio Sound 70, music 4 %, no ducking, 4 s b-roll) unless David asks otherwise.

## Underlord briefs

These are rebuilt wordings; the originals were lost. Keep the structure: target by id, list exact values, demand a read-back, forbid publishing. Pass `client_model`.

**Pass 1**
```
Create a NEW composition named "YouTube – Full Edit" (1920x1080) as a copy of the original composition (<original id>). Never edit the original or any other existing composition; every edit call must target the new composition's id. Tell me the new id first.
In the new composition only:
1. Clean the script: remove filler words (um, uh, you know, like as filler), false starts and retakes (keep the last take), and shorten every pause of 0.8 s or longer to about 0.3 s. Do not remove any real sentence.
2. Studio Sound on at intensity 70. Clip gain 100 %.
3. Punch-ins: split scenes at <N> emphasis moments I list below and set those short scenes (3–10 s each) to scale 1.15 with content position x 0, y +0.075. Everything else stays at scale 1.0. Hard cuts only, no transitions.
   <moment 1: from "<words>" to "<words>"> ...
4. Captions over the whole video: style "Karaoke: Preview", Plus Jakarta Sans weight 600, size 60, white text, active word white, background fully transparent, outline 0, shadow black blur 12, centred at x 960, y 864, two lines maximum.
5. Music: add a calm lo-fi instrumental bed from stock under the whole video, looped, gain 0.04 (4 %), no fades.
Do NOT add b-roll, images, titles, intro or outro yet. Do not publish.
Report: new composition id, final duration, scene list with start times, and the values you read back for Studio Sound, captions and music. Confirm the original composition is unchanged.
```

**Pass 2** (after the 720p check render and the SRT of the new composition)
```
Work ONLY in composition "YouTube – Full Edit" (<new id>). Every edit call must target that id. All times below are on THIS composition's timeline, measured from its current render.
1. B-roll: add these stock video clips, each muted, full-frame 1920x1080, above the camera layer and below the captions, hard cuts, no transitions:
   - <start s> for 4.0 s: <what to show>   (said: "<words>")
   ...
2. Image cards: these PNG files are already in the project. Place each full-frame for exactly 3.0 s, above the camera layer and below the captions, no animation:
   - card-01-<icon>.png at <start s>   (said: "<words>")
   ...
Change nothing else: no cuts, no caption, music or audio changes. Do not publish.
Report every clip you placed with its actual start and end time, and confirm from a rendered frame of each that it is full-frame with the caption visible over it.
```

**Read-only inspection**
```
READ-ONLY request. Do not change, add, delete, rename or publish anything. Inspect composition <id> and report exact values read from the project: canvas, duration, scene start times; every track type with clip counts; camera scale/position per scene, Studio Sound intensity, gain, ducking; caption style, font, weight, size, colours, box, outline, shadow, position; music asset, range, gain, fades; each b-roll clip's start, duration and size; each image card's file name, start and duration; any intro/outro/title layers; transitions.
```

## Thumbnail prompt

Reference image (the approved template, David at the mic on black with two pendant lamps): Higgsfield media id `f9d8d776-9ce1-41a8-90a3-43c2b7cc8644`. Used unchanged for episodes 62 and 64 apart from the two lines:

```
Recreate this exact YouTube thumbnail and keep EVERYTHING identical: the same man in the same pose at the same microphone, same black long-sleeve shirt, same dark studio with the two warm pendant lamps top-left and top-right, same wooden desk, same colours, same framing and crop, same text styling (extra-bold white uppercase geometric sans, left-aligned block on the left, vertically centred, line 1 bare, line 2 on a solid bright-red rectangle with square corners). Change ONLY the two text lines. Line 1 (bare white): "<LINE 1>". Line 2 (white on the red box): "<LINE 2>". Keep the text block entirely on the left half so it never touches the man. No other text, no logos, no watermark. The text must be spelled exactly: "<LINE 1>" / "<LINE 2>".
```

Settings: `gpt_image_2_5`, 16:9, quality high, resolution 2k, two variants. Output is 2688×1520 PNG; `thumb_finish.py` makes the 1920×1080 JPEG (episode 64's was 203 KB).

## YouTube copy

Template:
```
<Paragraph 1: what happened and the surprising claim, first person, 3–4 sentences.>

<Paragraph 2: "In this episode I break down ..." or the honest take, 2–4 sentences.>

⏱ Chapters
00:00 <Title Case, from the edited timeline>
...

📬 Get in Touch with David
Instagram: 📸 https://www.instagram.com/davidrdinardo
LinkedIn: 💼 https://www.linkedin.com/in/davidrdinardo
Website: https://laidoffto8figures.com
Email: me@daviddinardo.com

🚀 Powered by
Taxifi —
AI-powered bookkeeping, tax & payroll for incorporated Canadian businesses. Visit https://taxifi.ai and use code LAIDOFFTO8FIGURES for 1 month FREE.

This content is for general information only and is not financial, tax or legal advice.

#LaidOffTo8Figures #OttawaBusiness #<Topic> #<Topic> #<Topic>
```

Episode 64. Title: "Distribution Is the Moat: 3 Things I Learned at SaaS North". Opening: "I spent two days at SaaS North last week with founders, creators and AI experts. For a tech conference, the loudest message in the room surprised me: distribution is the moat, not technology. Five years ago you built first and sold second. Now AI can build the app from a prompt, so the winners are the people with an audience and a personal brand that looks nothing like everyone else's." / "In this episode I break down the three ideas I brought home: why distribution now comes before technology, why the smartest software companies are moving customers from monthly to annual and building the product with them, and why whoever builds the best agent for their industry is going to own it." Eleven chapters, from "00:00 What Every Founder at SaaS North Was Talking About" to "05:34 The Three Things to Take Home". Tags: SaaS North, distribution is the moat, personal brand, AI agents, annual recurring revenue, SaaS, founder content, content marketing, AI for business, entrepreneurship, startup advice, Ottawa entrepreneur, building a personal brand, David DiNardo, Laid Off to 8 Figures. Hashtags: #LaidOffTo8Figures #OttawaBusiness #SaaSNorth #PersonalBrand #AIAgents.

Episode 62. Title: "AI Replaced My Video Editor in 15 Minutes (Here's the Exact Setup)". Opening: "I paid an editor $1,000 to $1,500 a month for my podcast edits, reels and Shorts. Last week I sent the raw recording to Claude Code instead. Fifteen minutes later I had the full edit, three Shorts in my format, the thumbnail and the captions, plus an automation that posts them." Fourteen chapters. Hashtags: #LaidOffTo8Figures #OttawaBusiness #AIEditing #ClaudeCode #Entrepreneur.

Voice: plain, first person, specific numbers, short sentences, no hype words, no em dashes inside sentences.

## Instagram Reel caption (solo, no collaborator)

```
Comment EPISODE and I'll send you the full episode.

I went to a tech conference.
The founders weren't talking about technology.

They were talking about distribution.

AI can build the app.
Who's going to sell it?

Comment EPISODE for the full episode.

#LaidOffTo8Figures · #OttawaBusiness · #PersonalBrand · #Distribution · #SaaS · #Entrepreneur · #ContentCreation · #AITools · #FounderLife · #BusinessGrowth
```
Short lines, one thought per line, ten hashtags separated by " · ".

## Spotify and LinkedIn (not recovered)

The original skill had wording rules for the Spotify description and the LinkedIn post. They are gone, and those posts never went through a tool that kept them. David holds `lo8f-ep64-copy.md` (sent to him Nov 13) with both as they were written for episode 64. Until he shares it, write them as drafts and say so:

- Spotify: the title, then the two YouTube description paragraphs, then three to five takeaways as plain sentences. No chapters, no hashtags.
- LinkedIn: first person, a one-line hook, three short points from the episode, one line on why it matters to founders, the YouTube link last.
