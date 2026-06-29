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

## Customize

- **Episodes** — edit the `EPISODES` array at the top of `script.js`. Set
  `latest: true` on the newest one to show the red `LATEST` tag.
- **Copy** — the story, contact, and join sections live in `index.html`.
- **Social links** — replace the `#` placeholders in the Contact section.
- **Email signup** — the form in `script.js` (`initJoin`) is front-end only.
  Wire the `TODO` to your provider (ConvertKit, Beehiiv, Mailchimp, etc.).
- **Colors / fonts** — tweak the CSS variables in `:root` (`--accent`, etc.).
  Display type uses the system Helvetica/Arial stack; labels use Space Mono.

## Deploy

Any static host works:

- **GitHub Pages** — push and enable Pages on the branch.
- **Vercel / Netlify** — point at the repo; no build command needed.
