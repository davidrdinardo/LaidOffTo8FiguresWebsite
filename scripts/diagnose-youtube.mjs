#!/usr/bin/env node
/**
 * TEMPORARY, READ-ONLY diagnostic. Scratch branch only: never merge into the
 * site branch.
 *
 * Records what the YouTube Data API returns for the channel, so the cause of
 * the vanished episodes can be confirmed before the sync script is changed:
 *   - the channel's public video count,
 *   - every item in the uploads playlist, paginated to the end, with duration
 *     and privacy status,
 *   - the status of every video that ever appeared in episodes.json.
 *
 * Writes diagnostics/youtube-report.json. Touches nothing else. The API key is
 * never written anywhere.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY || "";

// Every videoId that ever appeared in episodes.json (from git history), oldest first.
const HISTORICAL = ["3tzCNsF-r6E","5o1lKD8B0yk","zVob3LZ3lDE","eyNJCmvfoXw","xAbqrAEN5tE","jcpe3_jU8UE","FRbseEJqbzA","il1J9YZ6lE0","COdM0mCzWmY","OcPkerf1urM","-6_ZivS5tKM","KE8kTP6RL5Y","RlPGf_Ubhg8","kFpviGU2gIc","7JKqnALeUsg","MtOdDWQBq84","V2nfvnRQ5tI","a8ZQO4mRLhM","YruhlGGwmCE","F87Cb-F_3ow","dkDvdePLRYE","pKFpsWNPRtg","MGVW-NRrPrk","enGnb5Fng1o","FFFd9VZsGac","jnoiZ96L_wQ","uX6eeY5CxMo","PusZQFtbjx8","9dtAHLgYqYk","FNTY227C6yg","OtPl2SPxjHs","4mLqStouVHU","5Ulaowuimxs","kDP2UYr8XRY","sZE-JkYaML4","DzzdXvubIq4","C1c404BaQ48","eYw2_KY4Nog","rad1uFC6444","6A4AbZsqeA8","uwXypWkiuRM","aYL91yaCwlM","186OuQd-b1c","l_VwpG5ePnQ","P7Jb-9IiAo0","IbVzYe1A0MA","_kOsU7-EFao","WVFnsJ-DVX0","Yj-7ul5HmvI","ZyExl_mXvYM","7FtJVIx5wFo","3D9wdZoz_J8","4KXRZURbPhM","nXtVXj_WM2Q","qzO5iqP9UAk","Mp49yEuhTpE","zYP_WvQCIUg","JOJP0sxShJ0","3nAIqMi7ahI","1t37WRs-7fs","bY8ryAdq3CI","l8FN8Tf3tyo","1US5vG2L704","7wCXH1C-47A"];
// The ones the sync dropped, with the date of the sync commit that dropped them.
const DROPPED = {
  "5o1lKD8B0yk": "2026-10-15",
  "3tzCNsF-r6E": "2026-10-31",
  "zVob3LZ3lDE": "2026-11-01",
  "eyNJCmvfoXw": "2026-11-01",
  "xAbqrAEN5tE": "2026-11-01",
};

const scrub = (s) => (KEY ? String(s).split(KEY).join("***") : String(s));

async function api(path, params) {
  const url = new URL(`${API}/${path}`);
  url.search = new URLSearchParams({ ...params, key: KEY }).toString();
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(scrub(`YouTube API ${path} -> ${res.status}: ${body.slice(0, 400)}`));
  }
  return res.json();
}

function isoToSeconds(iso) {
  const m = String(iso || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

async function listPlaylist(playlistId, parts = "snippet,contentDetails,status") {
  const pages = [];
  const items = [];
  let pageToken = "";
  let guard = 0;
  do {
    const data = await api("playlistItems", {
      part: parts,
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    pages.push({
      items: (data.items || []).length,
      hasNext: Boolean(data.nextPageToken),
      totalResults: data.pageInfo?.totalResults ?? null,
    });
    for (const it of data.items || []) items.push(it);
    pageToken = data.nextPageToken || "";
  } while (pageToken && ++guard < 400);
  return { pages, items, truncated: Boolean(pageToken) };
}

async function videosByIds(ids, part = "contentDetails,snippet,status") {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await api("videos", { part, id: batch.join(",") });
    for (const v of data.items || []) out.set(v.id, v);
  }
  return out;
}

async function main() {
  const report = { generatedAt: new Date().toISOString(), errors: [] };
  const step = async (name, fn) => {
    try { return await fn(); } catch (err) { report.errors.push(`${name}: ${scrub(err.message)}`); return null; }
  };

  if (!KEY) {
    report.errors.push("YOUTUBE_API_KEY is not set");
    return report;
  }

  let cfg = {};
  try { cfg = JSON.parse(await readFile(join(ROOT, "youtube.config.json"), "utf8")); } catch { /* optional */ }
  const maxEpisodes = Number(cfg.maxEpisodes ?? 200);
  const minDurationSeconds = Number(cfg.minDurationSeconds ?? 0);
  report.config = { channelId: cfg.channelId || "", handle: cfg.handle || "", maxEpisodes, minDurationSeconds };

  // 1. Channel
  const channel = await step("channels", async () => {
    const params = cfg.channelId
      ? { part: "contentDetails,snippet,statistics", id: cfg.channelId }
      : { part: "contentDetails,snippet,statistics", forHandle: String(cfg.handle || "").replace(/^@/, "") };
    const data = await api("channels", params);
    return data.items?.[0] || null;
  });
  if (!channel) { report.errors.push("channel not found"); return report; }
  const uploads = channel.contentDetails.relatedPlaylists.uploads;
  report.channel = {
    id: channel.id,
    title: channel.snippet?.title || "",
    uploads,
    statistics: channel.statistics || null,
  };

  // 2. Uploads playlist, paginated to the end
  const listing = await step("playlistItems(uploads)", () => listPlaylist(uploads));
  if (!listing) return report;
  report.playlist = { pages: listing.pages, rawItems: listing.items.length, truncated: listing.truncated };

  // 3. Durations / descriptions / status for everything in the playlist
  const ids = listing.items.map((it) => it.contentDetails?.videoId).filter(Boolean);
  const vids = (await step("videos(playlist)", () => videosByIds(ids))) || new Map();

  report.items = listing.items.map((it, i) => {
    const videoId = it.contentDetails?.videoId;
    const v = vids.get(videoId);
    const seconds = v ? isoToSeconds(v.contentDetails?.duration) : null;
    const thumbs = it.snippet?.thumbnails || {};
    return {
      i,
      position: it.snippet?.position ?? null,
      videoId,
      title: it.snippet?.title || "",
      addedAt: it.snippet?.publishedAt || null,
      videoPublishedAt: it.contentDetails?.videoPublishedAt || null,
      itemPrivacy: it.status?.privacyStatus || null,
      thumbnail: thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || "",
      thumbKeys: Object.keys(thumbs),
      inVideosList: Boolean(v),
      durationIso: v?.contentDetails?.duration ?? null,
      seconds,
      videoPrivacy: v?.status?.privacyStatus ?? null,
      uploadStatus: v?.status?.uploadStatus ?? null,
      live: v?.snippet?.liveBroadcastContent ?? null,
      // Descriptions only for long-form videos (what the site would publish).
      ...(v && seconds >= minDurationSeconds ? { description: v.snippet?.description || "" } : {}),
    };
  });

  // 4. What the current sync logic sees vs. what a full scan sees
  const usable = report.items.filter((x) => x.title !== "Private video" && x.title !== "Deleted video");
  const isLong = (x) => typeof x.seconds === "number" && x.seconds >= minDurationSeconds;
  const window = usable.slice(0, maxEpisodes);
  const longAll = usable.filter(isLong);
  const longInWindow = window.filter(isLong);
  const windowIds = new Set(window.map((x) => x.videoId));
  const brief = (x) => ({ i: x.i, videoId: x.videoId, title: x.title, seconds: x.seconds, videoPublishedAt: x.videoPublishedAt, addedAt: x.addedAt });
  const sortedByAdded = usable.every((x, k) => k === 0 || new Date(usable[k - 1].addedAt) >= new Date(x.addedAt));
  const sortedByPublished = usable.every((x, k) => k === 0 || new Date(usable[k - 1].videoPublishedAt) >= new Date(x.videoPublishedAt));
  const idCounts = new Map();
  for (const x of usable) idCounts.set(x.videoId, (idCounts.get(x.videoId) || 0) + 1);
  report.summary = {
    playlistItems: report.items.length,
    usableItems: usable.length,
    privateOrDeletedPlaceholders: report.items.length - usable.length,
    missingFromVideosList: usable.filter((x) => !x.inVideosList).map(brief),
    duplicateVideoIds: [...idCounts].filter(([, n]) => n > 1).map(([id, n]) => ({ id, n })),
    orderedByAddedAtDesc: sortedByAdded,
    orderedByVideoPublishedAtDesc: sortedByPublished,
    longFormTotal: longAll.length,
    underMinDuration: usable.length - longAll.length,
    currentLogic: { rawWindow: maxEpisodes, itemsInWindow: window.length, longFormInWindow: longInWindow.length },
    longFormOutsideWindow: longAll.filter((x) => !windowIds.has(x.videoId)).map(brief),
    oldestInWindow: window.length ? brief(window[window.length - 1]) : null,
    privacyCounts: usable.reduce((acc, x) => { const k = x.videoPrivacy || "unknown"; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
    liveCounts: usable.reduce((acc, x) => { const k = x.live || "unknown"; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
  };

  // 5. Status of every video that was ever an episode on the site
  const probeVids = (await step("videos(probe)", () => videosByIds(HISTORICAL))) || new Map();
  const indexOf = new Map(report.items.map((x) => [x.videoId, x.i]));
  report.probes = HISTORICAL.map((id) => {
    const v = probeVids.get(id);
    return {
      videoId: id,
      droppedOn: DROPPED[id] || null,
      inUploadsPlaylistAt: indexOf.has(id) ? indexOf.get(id) : null,
      returnedByVideosList: Boolean(v),
      privacyStatus: v?.status?.privacyStatus ?? null,
      uploadStatus: v?.status?.uploadStatus ?? null,
      seconds: v ? isoToSeconds(v.contentDetails?.duration) : null,
      title: v?.snippet?.title ?? null,
      publishedAt: v?.snippet?.publishedAt ?? null,
      channelId: v?.snippet?.channelId ?? null,
      live: v?.snippet?.liveBroadcastContent ?? null,
    };
  });

  // 6. YouTube's own long-form / Shorts / live playlists, for comparison only
  report.altPlaylists = {};
  for (const prefix of ["UULF", "UUSH", "UULV"]) {
    const pid = prefix + uploads.slice(2);
    try {
      const alt = await listPlaylist(pid, "contentDetails");
      report.altPlaylists[prefix] = {
        playlistId: pid,
        count: alt.items.length,
        truncated: alt.truncated,
        videoIds: alt.items.map((it) => it.contentDetails?.videoId),
      };
    } catch (err) {
      report.altPlaylists[prefix] = { playlistId: pid, error: scrub(err.message).slice(0, 300) };
    }
  }

  return report;
}

const report = await main().catch((err) => ({ generatedAt: new Date().toISOString(), errors: [scrub(err.message)] }));
await mkdir(join(ROOT, "diagnostics"), { recursive: true });
await writeFile(join(ROOT, "diagnostics", "youtube-report.json"), JSON.stringify(report, null, 1) + "\n");
console.log(`Report written: ${report.items ? report.items.length : 0} playlist items, ${report.errors.length} error(s).`);
if (report.summary) console.log(JSON.stringify({ ...report.summary, longFormOutsideWindow: report.summary.longFormOutsideWindow.length }, null, 1));
for (const e of report.errors) console.log("error:", e);
