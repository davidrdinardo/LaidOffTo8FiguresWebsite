# Approved hooks (episode 63, Craig Gauthier) — copy the voice, not the words

| Clip | TikTok lines (boxes, uppercase) | YouTube lines (red word) | Tag name | Length |
|---|---|---|---|---|
| Short 9 | THE CORPORATE / LADDER IS TERRIBLE | The Corporate / Ladder Is / **Terrible** | Craig Gauthier | 35.7 s |
| Short 10 | HIT A BASEBALL: $1B / SAVE A LIFE: $50K | Hit A Baseball: / $1 Billion. / Save A Life: **$50K** | Craig Gauthier | 40.1 s |
| Short 11 | MATT DAMON GAVE / EVERYONE A CUT | Matt Damon / Gave **Everyone** / A Cut | Craig Gauthier | 46.2 s |
| Short 12 | SAME EMPLOYEES: / $20M OR $1 BILLION? | Same Employees. / $20M Or / **$1 Billion?** | David DiNardo | 49.5 s |
| Short 13 | NO GOOD STORY / STARTS IN THE OFFICE | No Good Story / Starts In / **The Office** | Craig Gauthier | 42.0 s |
| Short 14 | INNOVATORS, / IMITATORS / AND IDIOTS | Innovators, / Imitators, / **And Idiots** | Craig Gauthier | 40.7 s |

Shorts 12–14 are the first ones with the tag on for the full clip; 9–11 only had it during the hook (before David asked for it throughout).

## Hook writing rules
- Say the claim, not the topic: "No Good Story Starts In The Office", not "Craig on careers".
- Numbers and names pull: $50K, $1 Billion, Matt Damon.
- Red word = the twist or the number. One word, two at most ("$1 Billion?").
- TikTok lines ≤ 19 characters; break at the natural pause. Three lines are fine when two overflow ("INNOVATORS, IMITATORS" was too wide).
- The title should still make sense to someone who never plays the sound.

## Caption copy that was used
TikTok (Short 13): "You checked every box. Now what? No good story starts with 'I was in the office at 9:30.' Craig Gauthier on Laid Off to 8 Figures. #mindset #entrepreneur #career #motivation #podcast"

YouTube (Short 13): "You checked every box. School, house, family, career. Now what? Craig Gauthier on the people who followed the guide they were handed and are now asking whether they have any stories. No good story starts with 'I was in the office at 9:30.'" + blank line + "Full episode: https://youtu.be/7wCXH1C-47A" + blank line + "#LaidOffTo8Figures #Entrepreneurship #Mindset #RulesOptional #Shorts"

## Things that went wrong once, so you don't repeat them
- Clips cut from the echoing part of the recording (ep 63 Shorts 4 and 6) had to be deleted and replaced; filtering did not fix them.
- Default Descript karaoke captions render blue italic in a white box until the highlight box alpha is set to 0.
- A six-composition Descript "transfer" project published every composition after the first at 50 kbps; one file per project fixed it.
- A Higgsfield presigned PUT URL returned 400 on reuse; always request a new one.
- From episode 63 David saw every clip as a draft before it went live. During episode 64 several batches went out without that step. On Nov 16 he confirmed he wants to approve everything first.
- Short 14's 1.0 s frame had Craig rubbing his eye; frame 0 was fine, the YouTube cover was moved to 2.5 s.
- Episode 64: Descript's "Karaoke: One word" captions rendered italic in an Arial-like face even though they read back as Manrope 800 upright, and Underlord could not fix it. Captions are now burned in by `captions.py`; the Descript cut carries none.
- Episode 64 Shorts 5 and 6 were captioned before anyone looked at the cut and turned out letterboxed (black bars). `finish.sh` now refuses a letterboxed cut.
- All nine episode 64 Shorts went out at about −21.6 LUFS, roughly 7 dB quieter than the clips around them in a feed (measured Nov 16 on Shorts 1, 4 and 9). `finish.sh` now normalises to about −14 LUFS (tested: −14.9, true peak −1.5 dBTP).
- Upload slots requested before a long wait answered HTTP 400 hours later (episode 64 Shorts 8 and 9). Request them when the files exist.
- A TikTok link was reported from the temporary id Metricool shows while TikTok is still processing; the final id was different.
- Two session restarts on Nov 13 delayed a "post now" Short by eight hours. Upload everything, then schedule everything.
- The solo and guest skills vanished from David's account between Nov 14 and Nov 16, and the session's working copy went with a restart. Skills now live in this repo.

# Episode 64 (solo, David alone) — hooks that shipped

| Clip | TikTok lines | YouTube lines (red word) | Length |
|---|---|---|---|
| Short 4 | SELL ANNUAL, / NOT MONTHLY | Sell **Annual**, / Not Monthly | 44.0 s |
| Short 5 | FIRST IT WAS CHAT. / NOW IT'S AGENTS. | First It Was Chat. / Now It's / **Agents.** | 36.6 s |
| Short 6 | FOUNDERS ARE / ALL IN ON / PERSONAL BRAND | Founders Are / All In On / **Personal Brand** | 36.4 s |
| Short 7 | STAND OUT FROM / THE AI SLOP | Stand Out / From The / **AI Slop** | 39.1 s |
| Short 8 | AN AGENT FOR / EVERY JOB | An **Agent** / For Every / Job | 33.0 s |
| Short 9 | 3 THINGS I LEARNED / AT SAAS NORTH | **3 Things** / I Learned At / SaaS North | 33.9 s |

Tag on all of them: David DiNardo. Shorts 1–3 were "Distribution Is the Moat, Not Technology", "4 AI Websites All Looked the Same" and "Whoever Owns the Agent Owns the Industry".

Solo copy that was used (Short 9). TikTok: "3 things I learned at SaaS North. / Distribution is the moat. Keep customers long term. Build the best agent for your business. / Full episode link in bio. / #entrepreneur #business #podcast #saas #aiagents". YouTube: "Two days at SaaS North, three takeaways. One: distribution is the moat, so build a personal brand. Two: keep customers for the long term and let them build the product with you. Three: build the best agent for your business, because whoever owns the agent will own the industry." + blank line + "Full episode: https://youtu.be/LpdIjUUYm44" + blank line + "#LaidOffTo8Figures #OttawaBusiness #SaaSNorth #Entrepreneur #Shorts".

Framing, episode 64: front camera zoom 1.03, pan x −0.0814, y +0.0144; side camera zoom 1.19, pan x +0.2069, y +0.0571; layer box 1080 × 1920 at (540, 960). Side-camera stretches in the raw file: 70.03–74.37 s, 254.57–258.30 s, 381.27–384.07 s. With these, eyes sat at x 46–53 %, y 22 % and the face size differed by 0.1 % between the two cameras (Short 9).
