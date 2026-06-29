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

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://www.googleapis.com/youtube/v3";

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) {
  console.error("✖ YOUTUBE_API_KEY is not set. Add it as a repo secret.");
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
  return { handle, channelId, maxEpisodes, minDurationSeconds };
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
    const data = await api("videos", { part: "contentDetails", id: batch.join(",") });
    for (const v of data.items || []) {
      const secs = isoToSeconds(v.contentDetails.duration);
      const ep = byId.get(v.id);
      if (ep) {
        ep.seconds = secs;
        ep.duration = fmtDuration(secs);
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
  const { uploads, title } = await getUploadsPlaylist(cfg);
  console.log(`▸ Channel: ${title || "(unknown)"}  uploads=${uploads}`);

  let videos = await getPlaylistVideoIds(uploads, cfg.maxEpisodes);
  videos = await addDurations(videos, cfg.minDurationSeconds);

  // Newest first
  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const total = videos.length;
  const episodes = videos.map((v, i) => ({
    num: total - i, // newest gets the highest number
    title: v.title,
    duration: v.duration,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    videoId: v.videoId,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt,
    latest: i === 0,
  }));

  const payload = {
    channel: title,
    updatedAt: new Date().toISOString(),
    count: episodes.length,
    episodes,
  };
  await writeFile(join(ROOT, "episodes.json"), JSON.stringify(payload, null, 2) + "\n");
  console.log(`✔ Wrote episodes.json (${episodes.length} episodes).`);
}

main().catch((err) => {
  console.error("✖", err.message);
  process.exit(1);
});
