# Laid Off To 8 Figures

A dark, editorial website for the **Laid Off To 8 Figures** personal brand —
inspired by neo-grotesque podcast sites (think Open Residency): near-black
background, a thin top bar with wordmark + search, a `+ MENU`, and a stack of
huge bold episode titles over a moody hero.

Built as a **static site** — no build step, no dependencies. Just HTML, CSS,
and a little vanilla JavaScript.

## Files

| File | What it does |
|------|--------------|
| `index.html` | Page structure: header, menu, hero/episodes, info, contact, join, search overlay |
| `styles.css` | All styling (dark theme, type scale, responsive layout) |
| `script.js` | Episode rendering, menu toggle, search overlay, newsletter form |

## Run it locally

It's a static site, so just open `index.html` — or serve it for nicer behavior:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## YouTube auto-sync

Episodes populate automatically from your YouTube channel. A GitHub Action
(`.github/workflows/sync-youtube.yml`) runs hourly, calls the YouTube Data API,
and writes `episodes.json` — which the site reads on load. No manual editing.

**One-time setup:**

1. **Get a YouTube Data API key**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/), create
     a project, and enable **YouTube Data API v3** (APIs & Services → Library).
   - Create an **API key** (APIs & Services → Credentials → Create credentials).
2. **Add the key as a repo secret**
   - Repo → **Settings → Secrets and variables → Actions → New repository secret**.
   - Name it `YOUTUBE_API_KEY`, paste the key.
3. **Point it at your channel** — edit `youtube.config.json`:
   - Set `"handle"` to your channel handle (e.g. `"@laidoffto8figures"`), **or**
   - Set `"channelId"` to your channel ID (starts with `UC…`, most reliable).
     Find it at your channel → **Settings → Advanced → Channel ID**.
4. **Run it** — push, or trigger manually: repo → **Actions → Sync YouTube
   episodes → Run workflow**. After it runs, `episodes.json` is updated and the
   site shows your real videos.

Options in `youtube.config.json`: `maxEpisodes` (cap), `minDurationSeconds`
(set e.g. `120` to hide Shorts).

> Until the key + channel are set, the site shows the placeholder episodes in
> `episodes.json` / the fallback list in `script.js`.

## Customize

- **Episodes** — handled by the YouTube sync above. To tweak the fallback shown
  before the first sync, edit `FALLBACK_EPISODES` at the top of `script.js`.
- **Copy** — the story, contact, and join sections live in `index.html`.
- **Social links** — YouTube / Spotify / Instagram / TikTok URLs are in the
  Contact section of `index.html` (and mirrored in the JSON-LD `sameAs` list).
- **Email signup** — the form posts to Beehiiv. To change providers, update the
  form `action` in `index.html` (see `initJoin` in `script.js`).
- **Colors / fonts** — tweak the CSS variables in `:root` (`--accent`, etc.).
  The big intro headline uses Anton (Google Fonts); body copy uses the system
  Helvetica/Arial stack; labels use Space Mono.

## Deploy

Any static host works:

- **GitHub Pages** — push and enable Pages on the branch.
- **Vercel / Netlify** — point at the repo; no build command needed.
