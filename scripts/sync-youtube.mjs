#!/usr/bin/env node
/**
 * Sync YouTube uploads -> episodes.json
 *
 * Reads the channel's "uploads" playlist via the YouTube Data API v3 and writes
 * an episodes.json the static site consumes. No npm dependencies (uses global
 * fetch from Node 18+).
 *
 * Env / config:
 *   YOUTUBE_API_KEY   (required)  API key, provided as a GitHub Actions secret.
 *   Channel is read from youtube.config.json (handle or channelId), and can be
 *   overridden by env vars YOUTUBE_HANDLE / YOUTUBE_CHANNEL_ID.
 */

import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://www.googleapis.com/youtube/v3";
const SITE = "https://laidoffto8figures.com";

const KEY = process.env.YOUTUBE_API_KEY;
// `--offline` skips the API and re-renders index.html from the existing
// episodes.json (handy after changing the markup templates below).
const OFFLINE = process.argv.includes("--offline");
if (!KEY && !OFFLINE) {
  console.error("✖ YOUTUBE_API_KEY is not set. Add it as a repo secret (or run with --offline).");
  process.exit(1);
}

/* ---- Load config ----------------------------------------------------- */
async function loadConfig() {
  let cfg = {};
  try {
    cfg = JSON.parse(await readFile(join(ROOT, "youtube.config.json"), "utf8"));
  } catch {
    /* config file optional if env vars are supplied */
  }
  const handle = process.env.YOUTUBE_HANDLE || cfg.handle || "";
  const channelId = process.env.YOUTUBE_CHANNEL_ID || cfg.channelId || "";
  const maxEpisodes = Number(cfg.maxEpisodes ?? 200);
  const minDurationSeconds = Number(cfg.minDurationSeconds ?? 0); // >0 filters out Shorts
  const tidyTitles = cfg.tidyTitles !== false; // default true
  return { handle, channelId, maxEpisodes, minDurationSeconds, tidyTitles };
}

/* ---- Tidy a raw YouTube title for display ----------------------------
   Drops a trailing " | …" suffix (guest name / channel tag) and any
   #hashtags, then collapses whitespace. Returns the original if cleaning
   would leave nothing. Toggle off with "tidyTitles": false in config.
--------------------------------------------------------------------- */
function cleanTitle(raw) {
  let t = String(raw);
  const pipe = t.indexOf(" | ");
  if (pipe !== -1) t = t.slice(0, pipe);        // strip suffix after first " | "
  t = t.replace(/#[^\s#]+/g, " ");               // remove hashtags
  t = t.replace(/\s{2,}/g, " ").trim();          // collapse whitespace
  t = t.replace(/[\s|:–—-]+$/u, "").trim();       // trim dangling separators
  return t || String(raw).trim();
}

/* ---- API helper ------------------------------------------------------- */
async function api(path, params) {
  const url = new URL(`${API}/${path}`);
  url.search = new URLSearchParams({ ...params, key: KEY }).toString();
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${path} -> ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

/* ---- Resolve channel -> uploads playlist ----------------------------- */
async function getUploadsPlaylist({ handle, channelId }) {
  let params;
  if (channelId) {
    params = { part: "contentDetails,snippet", id: channelId };
  } else if (handle) {
    params = { part: "contentDetails,snippet", forHandle: handle.replace(/^@/, "") };
  } else {
    throw new Error("No channel configured. Set `handle` or `channelId` in youtube.config.json.");
  }
  const data = await api("channels", params);
  const channel = data.items?.[0];
  if (!channel) throw new Error("Channel not found. Check the handle / channelId in youtube.config.json.");
  return {
    uploads: channel.contentDetails.relatedPlaylists.uploads,
    title: channel.snippet?.title || "",
  };
}

/* ---- Fetch all playlist items ---------------------------------------- */
async function getPlaylistVideoIds(playlistId, max) {
  const items = [];
  let pageToken = "";
  do {
    const data = await api("playlistItems", {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const it of data.items || []) {
      const title = it.snippet?.title || "";
      if (title === "Private video" || title === "Deleted video") continue;
      items.push({
        videoId: it.contentDetails?.videoId,
        title,
        publishedAt: it.contentDetails?.videoPublishedAt || it.snippet?.publishedAt,
        thumbnail:
          it.snippet?.thumbnails?.maxres?.url ||
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.medium?.url ||
          "",
      });
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken && items.length < max);
  return items.slice(0, max);
}

/* ---- Hydrate durations (videos.list, batches of 50) ------------------ */
async function addDurations(videos, minDurationSeconds) {
  const byId = new Map(videos.map((v) => [v.videoId, v]));
  const ids = [...byId.keys()];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await api("videos", { part: "contentDetails,snippet", id: batch.join(",") });
    for (const v of data.items || []) {
      const secs = isoToSeconds(v.contentDetails.duration);
      const ep = byId.get(v.id);
      if (ep) {
        ep.seconds = secs;
        ep.duration = fmtDuration(secs);
        ep.description = v.snippet?.description || "";
      }
    }
  }
  let out = [...byId.values()].filter((v) => typeof v.seconds === "number");
  if (minDurationSeconds > 0) out = out.filter((v) => v.seconds >= minDurationSeconds);
  return out;
}

function isoToSeconds(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}
function fmtDuration(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/* ---- Main ------------------------------------------------------------- */
async function main() {
  const cfg = await loadConfig();
  if (OFFLINE) {
    const prev = JSON.parse(await readFile(join(ROOT, "episodes.json"), "utf8"));
    console.log(`▸ Offline: re-rendering site from episodes.json (${prev.episodes.length} episodes).`);
    const before = JSON.stringify(prev);
    assignSlugs(prev.episodes, prev.episodes);
    if (JSON.stringify(prev) !== before) {
      await writeFile(join(ROOT, "episodes.json"), JSON.stringify(prev, null, 2) + "\n");
      console.log("✔ Stored slugs in episodes.json.");
    }
    await renderSite(prev.episodes, false);
    return;
  }
  const { uploads, title } = await getUploadsPlaylist(cfg);
  console.log(`▸ Channel: ${title || "(unknown)"}  uploads=${uploads}`);

  let videos = await getPlaylistVideoIds(uploads, cfg.maxEpisodes);
  videos = await addDurations(videos, cfg.minDurationSeconds);

  // Newest first
  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const outFile = join(ROOT, "episodes.json");
  let previous = null;
  try { previous = JSON.parse(await readFile(outFile, "utf8")); } catch { /* first run */ }

  const total = videos.length;
  const episodes = videos.map((v, i) => ({
    num: total - i, // newest gets the highest number
    title: cfg.tidyTitles ? cleanTitle(v.title) : v.title,
    duration: v.duration,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    videoId: v.videoId,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt,
    description: v.description || "",
    latest: i === 0,
  }));
  assignSlugs(episodes, previous?.episodes || []);

  // Skip the write when nothing but the timestamp would change — otherwise the
  // hourly Action commits (and redeploys the site) every run for no reason.
  const unchanged =
    previous &&
    previous.channel === title &&
    JSON.stringify(previous.episodes) === JSON.stringify(episodes);

  if (unchanged) {
    console.log(`✔ episodes.json already up to date (${episodes.length} episodes).`);
  } else {
    const payload = {
      channel: title,
      updatedAt: new Date().toISOString(),
      count: episodes.length,
      episodes,
    };
    await writeFile(outFile, JSON.stringify(payload, null, 2) + "\n");
    console.log(`✔ Wrote episodes.json (${episodes.length} episodes).`);
  }

  await renderSite(episodes, !unchanged);
}

async function renderSite(episodes, changed) {
  await updateEpisodeList(episodes);
  await updateEpisodeStructuredData(episodes);
  await writeEpisodePages(episodes);
  await writeSitemap(episodes, changed);
}

/* ---- Slugs: URL for each episode page, stable across runs ------------
   Reuses the slug an episode already had in the previous episodes.json so
   URLs never change when a title gets edited on YouTube.
--------------------------------------------------------------------- */
function slugify(str) {
  let s = String(str)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > 72) s = s.slice(0, 73).replace(/-[^-]*$/, ""); // cut at a word boundary
  return s || "episode";
}

function assignSlugs(episodes, previous) {
  const known = new Map(previous.filter((e) => e.slug).map((e) => [e.videoId, e.slug]));
  const used = new Set();
  for (const ep of episodes) {
    let slug = known.get(ep.videoId) || slugify(ep.title);
    if (used.has(slug)) slug = `${slug}-${ep.videoId.toLowerCase()}`;
    used.add(slug);
    ep.slug = slug;
    ep.pageUrl = `${SITE}/episodes/${slug}/`;
  }
}

/* ---- Sitemap: homepage + one entry per episode ----------------------- */
async function writeSitemap(episodes, changed) {
  const file = join(ROOT, "sitemap.xml");
  const today = new Date().toISOString().slice(0, 10);
  let homeLastmod = today;
  if (!changed) {
    try {
      const prev = await readFile(file, "utf8");
      const m = prev.match(/<loc>https:\/\/laidoffto8figures\.com\/<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/);
      if (m) homeLastmod = m[1];
    } catch { /* first run */ }
  }
  const urls = [
    `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${homeLastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...episodes.map((ep) =>
      `  <url>\n    <loc>${ep.pageUrl}</loc>\n    <lastmod>${(ep.publishedAt || today).slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  let existing = "";
  try { existing = await readFile(file, "utf8"); } catch { /* none */ }
  if (xml !== existing) {
    await writeFile(file, xml);
    console.log(`✔ Wrote sitemap.xml (${urls.length} URLs).`);
  }
}

/* ---- Episode pages: episodes/<slug>/index.html ----------------------- */
function linkify(escaped) {
  return escaped.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]]/g, (u) =>
    `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, "")}</a>`);
}

function descriptionToHtml(desc, videoId) {
  const text = String(desc || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "          <p class=\"muted\">Show notes coming soon. Watch the full episode above.</p>";
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return paras.map((p) => {
    let html = escapeHtml(p);
    html = linkify(html);
    // Timestamps like 12:34 or 1:02:03 at the start of a line -> seek links
    html = html.replace(/^(\d{1,2}:\d{2}(?::\d{2})?)(?=\s)/gm, (t) => {
      const parts = t.split(":").map(Number);
      const secs = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${secs}s" target="_blank" rel="noopener">${t}</a>`;
    });
    html = html.replace(/#(\w+)/g, '<span class="muted">#$1</span>');
    return "          <p>" + html.replace(/\n/g, "<br />\n          ") + "</p>";
  }).join("\n");
}

function metaDescription(ep) {
  const first = String(ep.description || "").replace(/\r\n?/g, "\n").split(/\n{2,}/)[0]
    .replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const base = first || `Episode ${ep.num} of Laid Off To 8 Figures: ${ep.title}. Real founders on building 8-figure businesses, hosted by David DiNardo.`;
  return base.length > 158 ? base.slice(0, 155).replace(/\s+\S*$/, "") + "…" : base;
}

function humanDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function isoDuration(d) {
  const parts = String(d || "").split(":").map(Number);
  if (parts.some(Number.isNaN) || !parts.length) return undefined;
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return `PT${h ? h + "H" : ""}${m}M${s}S`;
}

function episodeJsonLd(ep, meta) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "PodcastEpisode",
        "@id": `${ep.pageUrl}#episode`,
        name: ep.title,
        url: ep.pageUrl,
        episodeNumber: ep.num,
        description: meta,
        ...(ep.publishedAt ? { datePublished: ep.publishedAt } : {}),
        ...(ep.thumbnail ? { image: ep.thumbnail } : {}),
        ...(isoDuration(ep.duration) ? { timeRequired: isoDuration(ep.duration) } : {}),
        partOfSeries: { "@type": "PodcastSeries", "@id": `${SITE}/#podcast`, name: "Laid Off To 8 Figures", url: `${SITE}/` },
        author: { "@type": "Person", "@id": `${SITE}/#person`, name: "David DiNardo" },
        associatedMedia: { "@id": `${ep.pageUrl}#video` },
      },
      {
        "@type": "VideoObject",
        "@id": `${ep.pageUrl}#video`,
        name: ep.title,
        description: meta,
        thumbnailUrl: ep.thumbnail ? [ep.thumbnail] : undefined,
        uploadDate: ep.publishedAt,
        duration: isoDuration(ep.duration),
        contentUrl: ep.url,
        embedUrl: `https://www.youtube.com/embed/${ep.videoId}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Episodes", item: `${SITE}/#episodes` },
          { "@type": "ListItem", position: 3, name: ep.title, item: ep.pageUrl },
        ],
      },
    ],
  }, null, 2).replace(/<\//g, "<\\/");
}

function navLink(ep, kind) {
  if (!ep) return `<span class="nav-empty" aria-hidden="true"></span>`;
  const label = kind === "prev" ? "&larr; PREVIOUS EPISODE" : "NEXT EPISODE &rarr;";
  return `<a class="${kind}" href="/episodes/${ep.slug}/" rel="${kind}"><span class="nav-label">${label}</span><span class="nav-title">${escapeHtml(ep.title)}</span></a>`;
}

async function writeEpisodePages(episodes) {
  const template = await readFile(join(ROOT, "scripts", "episode-template.html"), "utf8");
  const dir = join(ROOT, "episodes");
  await mkdir(dir, { recursive: true });
  const keep = new Set(episodes.map((e) => e.slug));
  let written = 0;

  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const older = episodes[i + 1]; // list is newest-first
    const newer = episodes[i - 1];
    const meta = metaDescription(ep);
    const vars = {
      TITLE: escapeHtml(ep.title),
      META_DESCRIPTION: escapeHtml(meta),
      CANONICAL: ep.pageUrl,
      THUMB: ep.thumbnail || `https://i.ytimg.com/vi/${ep.videoId}/maxresdefault.jpg`,
      VIDEO_ID: ep.videoId,
      NUM: String(ep.num),
      NUM_PADDED: String(ep.num).padStart(2, "0"),
      DATE_ISO: (ep.publishedAt || "").slice(0, 10),
      DATE_HUMAN: humanDate(ep.publishedAt),
      DURATION: escapeHtml(ep.duration || ""),
      DESCRIPTION_HTML: descriptionToHtml(ep.description, ep.videoId),
      JSONLD: episodeJsonLd(ep, meta),
      PREV_LINK: navLink(older, "prev"),
      NEXT_LINK: navLink(newer, "next"),
      YEAR: String(new Date().getFullYear()),
    };
    const html = template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
    const pageDir = join(dir, ep.slug);
    await mkdir(pageDir, { recursive: true });
    const file = join(pageDir, "index.html");
    let existing = "";
    try { existing = await readFile(file, "utf8"); } catch { /* new */ }
    if (existing !== html) { await writeFile(file, html); written++; }
  }

  // Remove pages for episodes that no longer exist (deleted / private videos).
  for (const name of await readdir(dir)) {
    if (!keep.has(name)) {
      await rm(join(dir, name), { recursive: true, force: true });
      console.log(`✔ Removed stale episode page: episodes/${name}/`);
    }
  }
  if (written) console.log(`✔ Wrote ${written} episode page(s) under episodes/.`);
}

/* ---- Replace the text between two HTML comment markers --------------- */
function replaceBetween(html, START, END, inner) {
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s === -1 || e === -1 || e < s) return html;
  return html.slice(0, s) + START + inner + END + html.slice(e + END.length);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/* ---- Pre-render the episode list into index.html --------------------
   Crawlers and link previews don't run script.js, so the titles live in
   the HTML itself. Episodes past INITIAL_VISIBLE get `hidden`; script.js
   reveals them on VIEW MORE and reads the inline JSON for search.
--------------------------------------------------------------------- */
const INITIAL_VISIBLE = 6;

function episodeRow(ep, i) {
  const hidden = i >= INITIAL_VISIBLE ? " hidden" : "";
  const latest = ep.latest ? '<span class="ep-latest">LATEST</span>' : "";
  return (
    `      <li${hidden}>\n` +
    `        <a class="episode-row" href="/episodes/${ep.slug}/" data-num="${ep.num}" title="${escapeHtml(ep.title)}">\n` +
    `          <span class="ep-num">${String(ep.num).padStart(2, "0")}</span>\n` +
    `          <span class="ep-title">${escapeHtml(ep.title)}</span>\n` +
    `          <span class="ep-meta">${escapeHtml(ep.duration || "")}${latest}</span>\n` +
    `        </a>\n` +
    `      </li>\n`
  );
}

async function updateEpisodeList(episodes) {
  const file = join(ROOT, "index.html");
  let html;
  try { html = await readFile(file, "utf8"); } catch { return; }

  const rows = "\n" + episodes.map(episodeRow).join("") + "        ";
  let out = replaceBetween(html, "<!-- EPISODES_LIST_START -->", "<!-- EPISODES_LIST_END -->", rows);

  const remaining = Math.max(0, episodes.length - INITIAL_VISIBLE);
  const viewMore = remaining
    ? `<button type="button" class="view-more">VIEW MORE (${remaining})</button>`
    : `<button type="button" class="view-more" hidden>VIEW MORE</button>`;
  out = replaceBetween(out, "<!-- VIEW_MORE_START -->", "<!-- VIEW_MORE_END -->", viewMore);

  const data = episodes.map(({ num, title, duration, slug, latest }) => ({ num, title, duration, url: `/episodes/${slug}/`, ...(latest ? { latest } : {}) }));
  // "</" can't appear inside a <script> body; JSON.stringify never emits it unescaped after this.
  const json = JSON.stringify(data).replace(/<\//g, "<\\/");
  out = replaceBetween(out, "<!-- EPISODES_DATA_START -->", "<!-- EPISODES_DATA_END -->",
    `\n  <script id="episodes-data" type="application/json">${json}</script>\n  `);

  if (out !== html) {
    await writeFile(file, out);
    console.log(`✔ Rendered ${episodes.length} episodes into index.html.`);
  }
}

/* ---- Inject per-episode JSON-LD into index.html --------------------- */
async function updateEpisodeStructuredData(episodes) {
  const START = "<!-- EPISODES_JSONLD_START -->";
  const END = "<!-- EPISODES_JSONLD_END -->";
  const file = join(ROOT, "index.html");
  let html;
  try { html = await readFile(file, "utf8"); } catch { return; }
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s === -1 || e === -1 || e < s) return;

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Episodes — Laid Off To 8 Figures",
    itemListElement: episodes.map((ep, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "PodcastEpisode",
        "@id": `${ep.pageUrl}#episode`,
        name: ep.title,
        url: ep.pageUrl,
        ...(ep.publishedAt ? { datePublished: ep.publishedAt } : {}),
        ...(ep.thumbnail ? { image: ep.thumbnail } : {}),
        partOfSeries: {
          "@type": "PodcastSeries",
          name: "Laid Off To 8 Figures",
          url: "https://laidoffto8figures.com/",
        },
      },
    })),
  };

  const block =
    START +
    '\n  <script type="application/ld+json">\n' +
    JSON.stringify(jsonld, null, 2) +
    "\n  </script>\n  " +
    END;
  const out = html.slice(0, s) + block + html.slice(e + END.length);
  if (out !== html) {
    await writeFile(file, out);
    console.log(`✔ Updated episode structured data in index.html.`);
  }
}

main().catch((err) => {
  console.error("✖", err.message);
  process.exit(1);
});
