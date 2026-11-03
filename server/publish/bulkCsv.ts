/*
  Bulk upload CSV (spec 7.4). Columns, header row required:
    date (YYYY-MM-DD), time (HH:MM, 24h), platform, caption, media_url, first_comment
  Times are read in the brand time zone. Pure functions, tested in tests/bulkCsv.test.ts.
*/

export interface BulkRow {
  line: number;
  platform: string;
  caption: string;
  media_url?: string;
  first_comment?: string;
  scheduled_for: string; // ISO UTC
}

export const BULK_TEMPLATE = 'date,time,platform,caption,media_url,first_comment\n2026-11-10,09:00,instagram,"New serum drop, link in bio",https://example.com/serum.jpg,"Which shade are you?"\n';

const PLATFORMS = new Set(["instagram", "facebook", "tiktok", "linkedin", "threads", "pinterest", "youtube", "bluesky", "mastodon", "telegram", "discord"]);

/** RFC 4180 style CSV: quotes, escaped quotes, commas and new lines inside quotes */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** Local wall time in a time zone to a UTC ISO string */
export function zonedToUtc(date: string, time: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m || !t) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [h, mi] = [Number(t[1]), Number(t[2])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  try {
    // Offset of the zone at that moment, by formatting the guess in the zone
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
    const asZone = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const offset = asZone - guess;
    const out = new Date(guess - offset);
    if (out.getUTCDate() !== new Date(guess - offset).getUTCDate()) return null;
    return out.toISOString();
  } catch {
    return null;
  }
}

export function parseBulkCsv(text: string, timeZone = "UTC"): { rows: BulkRow[]; errors: Array<{ line: number; message: string }> } {
  const table = parseCsv(text);
  const errors: Array<{ line: number; message: string }> = [];
  if (!table.length) return { rows: [], errors: [{ line: 1, message: "The file is empty" }] };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  for (const k of ["date", "time", "platform", "caption"]) if (idx(k) < 0) errors.push({ line: 1, message: `Missing column: ${k}` });
  if (errors.length) return { rows: [], errors };
  const rows: BulkRow[] = [];
  if (table.length - 1 > 500) errors.push({ line: 1, message: "Only the first 500 rows are imported" });
  table.slice(1, 501).forEach((r, i) => {
    const line = i + 2;
    const get = (k: string) => (idx(k) >= 0 ? (r[idx(k)] || "").trim() : "");
    const platform = get("platform").toLowerCase();
    if (!PLATFORMS.has(platform)) return errors.push({ line, message: `Unknown platform "${get("platform")}". Use instagram, facebook, tiktok or linkedin.` });
    const when = zonedToUtc(get("date"), get("time"), timeZone);
    if (!when) return errors.push({ line, message: "Date must be YYYY-MM-DD and time HH:MM" });
    if (new Date(when).getTime() < Date.now()) return errors.push({ line, message: "This time is in the past" });
    const media = get("media_url");
    if (media && !/^https:\/\/\S+$/i.test(media)) return errors.push({ line, message: "media_url must be a public https link" });
    const caption = get("caption");
    if (!caption && !media) return errors.push({ line, message: "Add a caption or a media_url" });
    rows.push({ line, platform, caption, media_url: media || undefined, first_comment: get("first_comment") || undefined, scheduled_for: when });
  });
  return { rows, errors };
}
