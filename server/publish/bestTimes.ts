/*
  Best time to post (spec 7.5). From the account's own posts: average
  engagement per local hour, weekday aware when there is enough data.
  With fewer than MIN_POSTS posts it returns the default queue slots and says so.
*/
import { DEFAULT_QUEUE_SLOTS } from "./submit.js";

export const MIN_POSTS = 8;
const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function engagementOf(m: any): number {
  m = m || {};
  return n(m.likes ?? m.like_count) + 2 * n(m.comments ?? m.comments_count) + 3 * n(m.shares) + 3 * n(m.saved ?? m.saves);
}

function localParts(iso: string, timeZone: string): { hour: number; weekday: number } {
  const f = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23", weekday: "short" });
  const parts = Object.fromEntries(f.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { hour: Number(parts.hour) % 24, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday) };
}

export interface BestTimes {
  source: "your_posts" | "default";
  posts_analyzed: number;
  slots: Array<{ time: string; score: number | null; posts: number }>;
  by_weekday?: Record<number, string>;
  note: string;
}

export function bestTimes(posts: Array<{ posted_at: string; raw_metrics?: any; platform?: string }>, timeZone: string, top = 3): BestTimes {
  const usable = posts.filter((p) => p.posted_at && !isNaN(new Date(p.posted_at).getTime()));
  if (usable.length < MIN_POSTS) {
    return {
      source: "default",
      posts_analyzed: usable.length,
      slots: DEFAULT_QUEUE_SLOTS.map((time) => ({ time, score: null, posts: 0 })),
      note: `Zie needs at least ${MIN_POSTS} of your posts to learn your best times. Until then these are common times for your time zone.`,
    };
  }
  const byHour = new Map<number, { sum: number; count: number }>();
  const byDayHour = new Map<string, { sum: number; count: number }>();
  for (const p of usable) {
    const { hour, weekday } = localParts(p.posted_at, timeZone);
    const e = engagementOf(p.raw_metrics);
    const h = byHour.get(hour) || { sum: 0, count: 0 };
    byHour.set(hour, { sum: h.sum + e, count: h.count + 1 });
    const k = `${weekday}:${hour}`;
    const d = byDayHour.get(k) || { sum: 0, count: 0 };
    byDayHour.set(k, { sum: d.sum + e, count: d.count + 1 });
  }
  // An hour needs 2 posts before its average counts, so one viral post does not decide the slot
  const ranked = [...byHour.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([hour, v]) => ({ hour, avg: v.sum / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, top);
  const slots = ranked.map((r) => ({ time: `${String(r.hour).padStart(2, "0")}:00`, score: Math.round(r.avg), posts: r.count }));
  if (!slots.length) {
    return { source: "default", posts_analyzed: usable.length, slots: DEFAULT_QUEUE_SLOTS.map((time) => ({ time, score: null, posts: 0 })), note: "Your posts are spread over many hours, so there is no clear best time yet." };
  }
  const by_weekday: Record<number, string> = {};
  for (let d = 0; d < 7; d++) {
    const best = [...byDayHour.entries()]
      .filter(([k, v]) => k.startsWith(`${d}:`) && v.count >= 2)
      .sort((a, b) => b[1].sum / b[1].count - a[1].sum / a[1].count)[0];
    if (best) by_weekday[d] = `${best[0].split(":")[1].padStart(2, "0")}:00`;
  }
  return { source: "your_posts", posts_analyzed: usable.length, slots, by_weekday, note: `Based on engagement on your last ${usable.length} posts.` };
}
