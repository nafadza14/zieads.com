/*
  AI Analyst overview: what Zie has seen across every connected account
  for a chosen window (24h, 3d, 7d, 30d), compared with the previous window
  of the same length. Pure reads, computed on request from stored data, so it
  always reflects the latest sync.
*/
import { supabaseAdmin } from "../supabaseServer.js";

export type Period = "24h" | "3d" | "7d" | "30d";
const HOURS: Record<Period, number> = { "24h": 24, "3d": 72, "7d": 168, "30d": 720 };
const H = 3600 * 1000;

// Questions and buying intent, in English and Bahasa Indonesia
const INTENT_RE = /\?|\b(harga|berapa|brp|hrg|price|how much|cost|ready|stok|stock|cara order|order|beli|buy|where to buy|dimana|di mana|cod|ongkir|shipping|available|tersedia|size|ukuran|varian|pm|dm)\b/i;
const QUESTION_RE = /\?|\b(how|what|when|where|why|kapan|gimana|bagaimana|apa|apakah|bisa)\b/i;

const num = (v: any) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);
const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? null : 0);
const iso = (t: number) => new Date(t).toISOString();

function metric(cur: number, prev: number, extra: Record<string, any> = {}) {
  return { value: cur, previous: prev, change_pct: pct(cur, prev), ...extra };
}

function buckets(period: Period, from: number, to: number) {
  const size = period === "24h" ? 2 * H : period === "3d" ? 6 * H : 24 * H;
  const out: Array<{ start: number; label: string }> = [];
  for (let t = from; t < to; t += size) {
    const d = new Date(t);
    out.push({
      start: t,
      label: period === "24h" || period === "3d" ? d.toISOString().slice(11, 13) + ":00" : d.toISOString().slice(5, 10),
    });
  }
  return { size, list: out };
}

export async function computeOverview(userId: string, period: Period = "24h") {
  const hours = HOURS[period] || 24;
  const now = Date.now();
  const from = now - hours * H;
  const prevFrom = from - hours * H;

  const [conns, comments, posts, insights, sched, alerts, briefing] = await Promise.all([
    supabaseAdmin.from("social_connections").select("platform, platform_username, platform_display_name, is_active, last_synced_at, token_expires_at, connected_at").eq("user_id", userId),
    supabaseAdmin
      .from("comments_inbox")
      .select("id, platform, author_username, text, sentiment, status, replied_at, posted_at, created_at, reply_text")
      .eq("user_id", userId)
      .gte("created_at", iso(Math.min(prevFrom, now - 30 * 24 * H)))
      .order("created_at", { ascending: false })
      .limit(2000),
    supabaseAdmin
      .from("social_posts")
      .select("id, platform, content_text, media_type, posted_at, post_url, raw_metrics, media_urls")
      .eq("user_id", userId)
      .gte("posted_at", iso(prevFrom))
      .order("posted_at", { ascending: false })
      .limit(400),
    supabaseAdmin
      .from("account_insights_daily")
      .select("platform, snapshot_date, followers_count, reach_daily, impressions_daily, profile_views_daily, website_clicks_daily")
      .eq("user_id", userId)
      .gte("snapshot_date", iso(prevFrom - 24 * H).slice(0, 10))
      .order("snapshot_date", { ascending: true }),
    supabaseAdmin.from("scheduled_posts").select("id, platform, caption, status, scheduled_for, published_at, error_message, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(200),
    supabaseAdmin.from("anomaly_alerts").select("id, alert_type, severity, message, suggested_action, triggered_at, acknowledged_at, pct_change").eq("user_id", userId).gte("triggered_at", iso(from)).order("triggered_at", { ascending: false }).limit(20),
    supabaseAdmin.from("ai_briefings").select("briefing_date, summary, highlights, recommended_actions, anomalies_detected, generated_at").eq("user_id", userId).order("briefing_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const connections = (conns.data || []).filter((c: any) => c.is_active);
  const allComments = (comments.data || []).map((c: any) => ({ ...c, at: new Date(c.posted_at || c.created_at).getTime() }));
  const cur = allComments.filter((c) => c.at >= from);
  const prev = allComments.filter((c) => c.at >= prevFrom && c.at < from);

  // ── Comments ───────────────────────────────────────────────────────────
  const isAnswered = (c: any) => c.status === "replied" || !!c.replied_at;
  const unansweredAll = allComments.filter((c) => !isAnswered(c) && c.status !== "archived");
  const replied = cur.filter(isAnswered);
  const replyHours = replied
    .map((c) => (c.replied_at ? (new Date(c.replied_at).getTime() - c.at) / H : null))
    .filter((x): x is number => x !== null && x >= 0)
    .sort((a, b) => a - b);
  const median = (a: number[]) => (a.length ? a[Math.floor(a.length / 2)] : null);
  const prevReplied = prev.filter(isAnswered);
  const sentiment = (list: any[]) => ({
    positive: list.filter((c) => c.sentiment === "positive").length,
    neutral: list.filter((c) => !c.sentiment || c.sentiment === "neutral").length,
    negative: list.filter((c) => c.sentiment === "negative").length,
  });
  const intent = cur.filter((c) => INTENT_RE.test(c.text || ""));
  const questions = cur.filter((c) => QUESTION_RE.test(c.text || ""));
  const waitingList = unansweredAll
    .filter((c) => c.at >= now - 30 * 24 * H)
    .sort((a, b) => a.at - b.at)
    .map((c) => ({
      id: c.id,
      platform: c.platform,
      from: c.author_username,
      text: (c.text || "").slice(0, 200),
      sentiment: c.sentiment || "neutral",
      waiting_hours: Math.round(((now - c.at) / H) * 10) / 10,
      intent: INTENT_RE.test(c.text || ""),
      has_ai_draft: !!c.reply_text,
    }));

  // Recurring words in comments, a cheap theme signal
  const stop = new Set("the a an and or to of in on for is it this that i you we my your yang dan di ke ini itu aku saya kak ka ya ga gak nya ada dengan untuk dari".split(" "));
  const words: Record<string, number> = {};
  for (const c of cur) for (const w of String(c.text || "").toLowerCase().match(/[a-zÀ-ɏ]{4,}/g) || []) if (!stop.has(w)) words[w] = (words[w] || 0) + 1;
  const themes = Object.entries(words).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word, count]) => ({ word, count }));

  // ── Posts and engagement ───────────────────────────────────────────────
  const shaped = (posts.data || []).map((p: any) => {
    const m = p.raw_metrics || {};
    const likes = num(m.likes ?? m.like_count);
    const comms = num(m.comments ?? m.comments_count);
    const saves = num(m.saved ?? m.saves);
    const shares = num(m.shares);
    const reach = num(m.reach);
    const views = num(m.views ?? m.plays ?? m.impressions ?? m.video_views);
    return {
      id: p.id,
      platform: p.platform,
      caption: (p.content_text || "").slice(0, 140),
      format: String(m.media_product_type || p.media_type || "post").toLowerCase(),
      posted_at: p.posted_at,
      at: new Date(p.posted_at).getTime(),
      url: p.post_url || m.permalink,
      thumb: Array.isArray(p.media_urls) ? p.media_urls[0] : undefined,
      likes,
      comments: comms,
      saves,
      shares,
      reach,
      views,
      interactions: likes + comms + saves + shares,
    };
  });
  const postsCur = shaped.filter((p) => p.at >= from);
  const postsPrev = shaped.filter((p) => p.at >= prevFrom && p.at < from);
  const sum = (a: any[], k: string) => a.reduce((s, x) => s + num(x[k]), 0);
  const er = (list: any[]) => {
    const r = sum(list, "reach");
    return r ? Math.round((sum(list, "interactions") / r) * 10000) / 100 : null;
  };

  // ── Account level ──────────────────────────────────────────────────────
  const rows = insights.data || [];
  const byPlatform: Record<string, any[]> = {};
  for (const r of rows) (byPlatform[r.platform] ||= []).push(r);
  let followersNow = 0;
  let followersAtFrom = 0;
  let followersAtPrevFrom = 0;
  let reachCur = 0;
  let reachPrev = 0;
  const fromDay = iso(from).slice(0, 10);
  const prevDay = iso(prevFrom).slice(0, 10);
  for (const list of Object.values(byPlatform)) {
    const last = list[list.length - 1];
    followersNow += num(last?.followers_count);
    const atFrom = [...list].reverse().find((r) => r.snapshot_date <= fromDay) || list[0];
    const atPrev = [...list].reverse().find((r) => r.snapshot_date <= prevDay) || list[0];
    followersAtFrom += num(atFrom?.followers_count);
    followersAtPrevFrom += num(atPrev?.followers_count);
    reachCur += list.filter((r) => r.snapshot_date > fromDay).reduce((s, r) => s + num(r.reach_daily), 0);
    reachPrev += list.filter((r) => r.snapshot_date > prevDay && r.snapshot_date <= fromDay).reduce((s, r) => s + num(r.reach_daily), 0);
  }
  if (!reachCur) reachCur = sum(postsCur, "reach");
  if (!reachPrev) reachPrev = sum(postsPrev, "reach");
  const followerNet = followersNow - followersAtFrom;
  const followerNetPrev = followersAtFrom - followersAtPrevFrom;

  // ── Series ─────────────────────────────────────────────────────────────
  const b = buckets(period, from, now);
  const series = b.list.map((x) => {
    const end = x.start + b.size;
    const cs = cur.filter((c) => c.at >= x.start && c.at < end);
    const ps = postsCur.filter((p) => p.at >= x.start && p.at < end);
    return { label: x.label, comments: cs.length, negative: cs.filter((c) => c.sentiment === "negative").length, posts: ps.length, interactions: sum(ps, "interactions") };
  });

  // ── Publishing and drafts ──────────────────────────────────────────────
  const schedRows = sched.data || [];
  const drafts = schedRows.filter((s: any) => s.status === "draft");
  const failed = schedRows.filter((s: any) => s.status === "failed" && new Date(s.updated_at).getTime() >= from);
  const upcoming = schedRows.filter((s: any) => s.status === "scheduled" && s.scheduled_for && new Date(s.scheduled_for).getTime() > now);

  // ── Channel health ─────────────────────────────────────────────────────
  const channels = connections.map((c: any) => {
    const synced = c.last_synced_at ? new Date(c.last_synced_at).getTime() : null;
    const expired = c.token_expires_at ? new Date(c.token_expires_at).getTime() < now : false;
    return {
      platform: c.platform,
      handle: c.platform_username || c.platform_display_name,
      last_synced_at: c.last_synced_at,
      status: expired ? "reconnect" : !synced ? "waiting" : now - synced > 26 * H ? "stale" : "live",
    };
  });

  // ── What changed: a single timeline of events ──────────────────────────
  type Ev = { at: string; kind: string; severity: "info" | "good" | "warn" | "bad"; title: string; detail?: string; link?: string };
  const events: Ev[] = [];
  for (const p of postsCur.slice(0, 12)) events.push({ at: p.posted_at, kind: "post", severity: "info", title: `New ${p.format} on ${p.platform}`, detail: p.caption || undefined, link: p.url });
  for (const c of cur.filter((c) => c.sentiment === "negative").slice(0, 6))
    events.push({ at: iso(c.at), kind: "negative_comment", severity: "bad", title: `Negative comment from @${c.author_username}`, detail: (c.text || "").slice(0, 120), link: `/inbox?comment=${c.id}` });
  for (const c of intent.filter((c) => !isAnswered(c)).slice(0, 6))
    events.push({ at: iso(c.at), kind: "buying_question", severity: "warn", title: `Buying question from @${c.author_username}`, detail: (c.text || "").slice(0, 120), link: `/inbox?comment=${c.id}` });
  for (const a of alerts.data || [])
    events.push({ at: a.triggered_at, kind: "anomaly", severity: a.severity === "critical" || a.severity === "high" ? "bad" : "warn", title: a.message, detail: a.suggested_action || undefined });
  for (const s of failed) events.push({ at: s.updated_at, kind: "publish_failed", severity: "bad", title: `A ${s.platform} post failed to publish`, detail: s.error_message || undefined, link: "/calendar" });
  for (const s of schedRows.filter((s: any) => s.status === "published" && s.published_at && new Date(s.published_at).getTime() >= from))
    events.push({ at: s.published_at, kind: "published", severity: "good", title: `Published to ${s.platform}`, detail: (s.caption || "").slice(0, 100), link: "/calendar" });
  if (period !== "24h" || followerNet !== 0) {
    if (followerNet > 0) events.push({ at: iso(now), kind: "followers", severity: "good", title: `+${followerNet.toLocaleString()} followers in this period`, link: "/analytics" });
    if (followerNet < 0) events.push({ at: iso(now), kind: "followers", severity: "warn", title: `${followerNet.toLocaleString()} followers in this period`, link: "/analytics" });
  }
  for (const ch of channels.filter((c: any) => c.status === "reconnect" || c.status === "stale"))
    events.push({ at: iso(now), kind: "channel", severity: ch.status === "reconnect" ? "bad" : "warn", title: ch.status === "reconnect" ? `Reconnect ${ch.platform}` : `${ch.platform} data is more than a day old`, detail: ch.status === "reconnect" ? "The access token expired, so Zie cannot read new data." : "Zie will retry on the next check.", link: "/connections" });
  events.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());

  // ── Needs you now ──────────────────────────────────────────────────────
  const overdue = waitingList.filter((c) => c.waiting_hours >= 24);
  const intentWaiting = waitingList.filter((c) => c.intent);
  const todo = [
    intentWaiting.length && { key: "intent", severity: "bad", title: `${intentWaiting.length} buying ${intentWaiting.length === 1 ? "question" : "questions"} waiting`, detail: "Price, stock and order questions are sales. Reply while they are warm.", cta: "Draft replies with Zie", prompt: "Draft replies for every unanswered buying question (price, stock, how to order) in my comments", link: "/inbox" },
    overdue.length && { key: "overdue", severity: "warn", title: `${overdue.length} ${overdue.length === 1 ? "comment" : "comments"} waiting more than 24 hours`, detail: "Most people expect a reply within a day.", cta: "Open Inbox", link: "/inbox" },
    drafts.length && { key: "drafts", severity: "info", title: `${drafts.length} ${drafts.length === 1 ? "draft" : "drafts"} waiting for your review`, detail: "Zie prepared them. Approve or edit before they can publish.", cta: "Review drafts", link: "/calendar" },
    failed.length && { key: "failed", severity: "bad", title: `${failed.length} ${failed.length === 1 ? "post" : "posts"} failed to publish`, detail: "Check the error and retry from the calendar.", cta: "Open calendar", link: "/calendar" },
    !upcoming.length && connections.length && { key: "empty", severity: "info", title: "Nothing scheduled ahead", detail: "Your calendar is empty. Let Zie plan the next posts from what works.", cta: "Plan next week", prompt: "Create posts for next week from my best formats and put them on my schedule as drafts" },
    channels.some((c: any) => c.status === "reconnect") && { key: "reconnect", severity: "bad", title: "A channel needs reconnecting", detail: "Zie cannot monitor it until you reconnect.", cta: "Open Connections", link: "/connections" },
  ].filter(Boolean);

  const lastSync = channels.map((c: any) => c.last_synced_at).filter(Boolean).sort().pop() || null;

  return {
    period,
    window: { from: iso(from), to: iso(now), previous_from: iso(prevFrom) },
    monitoring: {
      channels,
      channels_live: channels.filter((c: any) => c.status === "live").length,
      last_sync_at: lastSync,
    },
    kpis: {
      comments: metric(cur.length, prev.length),
      unanswered: { value: waitingList.length, overdue_24h: overdue.length },
      response_rate: metric(cur.length ? Math.round((replied.length / cur.length) * 100) : 0, prev.length ? Math.round((prevReplied.length / prev.length) * 100) : 0, { unit: "%" }),
      median_reply_hours: { value: median(replyHours) },
      buying_questions: metric(intent.length, prev.filter((c) => INTENT_RE.test(c.text || "")).length),
      followers: { value: followersNow, net: followerNet, previous_net: followerNetPrev, change_pct: followersAtFrom ? Math.round((followerNet / followersAtFrom) * 1000) / 10 : null },
      reach: metric(reachCur, reachPrev),
      interactions: metric(sum(postsCur, "interactions"), sum(postsPrev, "interactions")),
      engagement_rate: { value: er(postsCur), previous: er(postsPrev) },
      posts: metric(postsCur.length, postsPrev.length),
    },
    comments: {
      sentiment: sentiment(cur),
      previous_sentiment: sentiment(prev),
      questions: questions.length,
      buying_intent: intent.length,
      themes,
      waiting: waitingList.slice(0, 8),
    },
    content: {
      top: [...postsCur].sort((a, b) => b.interactions - a.interactions).slice(0, 3),
      weakest: postsCur.length > 3 ? [...postsCur].sort((a, b) => a.interactions - b.interactions)[0] : null,
      by_format: Object.entries(
        postsCur.reduce((m: Record<string, { posts: number; interactions: number }>, p) => {
          const x = (m[p.format] ||= { posts: 0, interactions: 0 });
          x.posts++;
          x.interactions += p.interactions;
          return m;
        }, {}),
      ).map(([format, v]) => ({ format, posts: v.posts, avg_interactions: Math.round(v.interactions / v.posts) })),
    },
    publishing: { drafts: drafts.length, upcoming: upcoming.length, failed: failed.length, next: upcoming.sort((a: any, b: any) => +new Date(a.scheduled_for) - +new Date(b.scheduled_for))[0] || null },
    series,
    events: events.slice(0, 30),
    todo,
    briefing: briefing.data || null,
  };
}
