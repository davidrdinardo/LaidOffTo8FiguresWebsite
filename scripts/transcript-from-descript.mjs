#!/usr/bin/env node
/**
 * Build transcripts/<videoId>.json from a Descript transcript export.
 *
 *   node scripts/transcript-from-descript.mjs --video-id <id> --in export.txt \
 *        [--meta meta.json] [--project-id <uuid>] [--composition-id <uuid>]
 *
 * export.txt  : Descript "txt" export with timecodes on paragraphs
 *               ([HH:MM:SS] at the start of each paragraph; optional
 *               "Name:" speaker prefix).
 * meta.json   : optional { "guest": "...", "summary": "...", "takeaways": [...] ,
 *               "speakersVerified": false }. Anything given here overrides
 *               what is already in the output file; anything omitted is kept.
 *
 * Re-running is safe: existing summary/takeaways/guest are preserved unless
 * meta.json replaces them. Filler words are stripped, nothing is paraphrased.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
    return acc;
  }, [])
);

if (!args["video-id"] || !args.in) {
  console.error("usage: transcript-from-descript.mjs --video-id <id> --in export.txt [--meta meta.json] [--project-id id] [--composition-id id]");
  process.exit(1);
}

const HOST = "David DiNardo";

function toSeconds(hms) {
  const p = hms.split(":").map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

function cleanText(t) {
  return t
    .replace(/\s+/g, " ")
    .replace(/\b(?:uh|um|umm|uhh|mm-hmm|mm|hmm)\b[,.]?\s*/gi, "")
    .replace(/\b(\w+)[,-]\s+\1\b/gi, "$1")          // "the, the" / "th- the"
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
}

function parse(txt) {
  const segments = [];
  const blocks = txt.replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  let lastSpeaker = HOST;
  for (const block of blocks) {
    const m = block.trim().match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/);
    if (!m) continue;
    let text = m[2].trim();
    let speaker = lastSpeaker;
    const sp = text.match(/^([A-Z][\w.'-]*(?: [A-Z][\w.'-]*){0,3}|Speaker \d+):\s+([\s\S]*)$/);
    if (sp) { speaker = sp[1]; text = sp[2]; lastSpeaker = speaker; }
    text = cleanText(text);
    if (!text) continue;
    segments.push({ start: toSeconds(m[1]), speaker, text });
  }
  return segments;
}

const raw = await readFile(args.in, "utf8");
const segments = parse(raw);
if (!segments.length) {
  console.error("✖ No timestamped paragraphs found. Export from Descript with timecodes on paragraphs.");
  process.exit(1);
}

const outDir = join(ROOT, "transcripts");
await mkdir(outDir, { recursive: true });
const outFile = join(outDir, `${args["video-id"]}.json`);
let existing = {};
try { existing = JSON.parse(await readFile(outFile, "utf8")); } catch { /* new */ }
let meta = {};
if (args.meta) meta = JSON.parse(await readFile(args.meta, "utf8"));

const out = {
  videoId: args["video-id"],
  ...(existing.num != null ? { num: existing.num } : {}),
  ...(meta.num != null ? { num: meta.num } : {}),
  source: {
    kind: "descript",
    projectId: args["project-id"] || existing.source?.projectId || null,
    compositionId: args["composition-id"] || existing.source?.compositionId || null,
  },
  guest: meta.guest !== undefined ? meta.guest : existing.guest ?? null,
  summary: meta.summary ?? existing.summary ?? "",
  takeaways: meta.takeaways ?? existing.takeaways ?? [],
  speakersVerified: meta.speakersVerified ?? existing.speakersVerified ?? false,
  segments,
};

await writeFile(outFile, JSON.stringify(out, null, 1) + "\n");
const words = segments.reduce((a, s) => a + s.text.split(/\s+/).length, 0);
console.log(`✔ transcripts/${args["video-id"]}.json — ${segments.length} segments, ${words} words, last timestamp ${segments[segments.length - 1].start}s` +
  (out.summary ? "" : "  (no summary yet — add one via --meta)"));
