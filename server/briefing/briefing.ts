/*
  Daily briefing, answer first (spec 7.2):
    1. Summary: 2 to 4 points on what changed and why
    2. Needs you: comments waiting, failed posts, accounts with problems
    3. Wins and concerns with the change against the previous period
    4. Three actions for today, each an agent task with Approve, Edit, Dismiss
    5. Channel status: live, last sync, errors
  The structure is built from real numbers by rules, so a briefing exists for every
  active brand every day even when the AI model is unavailable. When the model is
  available it only rewrites the summary wording; it never adds numbers.
*/
import { supabaseAdmin, getEffectivePlan } from "../supabaseServer.js";
import { computeOverview } from "../monitor/overview.js";
import { reliabilityReport } from "../guardian/guardian.js";
import { createAgentTask, logActivity } from "../activity.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { NO_EM_DASH_RULE, stripDashes } from "../utils/noEmDash.js";

export interface BriefingItem {
  title: string;
  detail?: string;
  metric?: string;
  delta_pct?: number | null;
  link?: string;
}
export interface BriefingAction {
  rank: number;
  title: string;
  why: string;
  kind: string;
  prompt?: string;
  link?: string;
  evidence: Array<{ label: string; value?: string | number; url?: string }>;
  task_id?: string;
}
export interface Briefing {
  version: 2;
  date: string;
  headline: string;
  summary: string[];
  needs_you: BriefingItem[];
  wins: BriefingItem[];
  concerns: BriefingItem[];
  actions: BriefingAction[];
  channels: Array<{ platform: string; handle?: string; status: string; last_synced_at?: string | null; error?: string | null }>;
  reliability?: { due: number; published: number; on_time: number; failed: number; on_time_rate: number | null };
  ads?: { spend: number; roas: number | null; change_pct: number | null } | null;
}

const pctText = (p: number | null | undefined) => (p === null || p === undefined ? "" : `${p > 0 ? "+" : ""}${p}%`);
const n = (v: number) => (Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString("en-US"));

/** Pure rules: from the 7 day overview (and optional extras) to a briefing. Exported for tests. */
export function buildBriefing(
  ov: any,
  extras: { date: string; guardianTasks?: any[]; reliability?: any; ads?: any; threshold?: number } = { date: new Date().toISOString().slice(0, 10) }
): Briefing {
  const k = ov?.kpis || {};
  const threshold = extras.threshold ?? 25;
  const channels = (ov?.monitoring?.channels || []).map((c: any) => ({ platform: c.platform, handle: c.handle, status: c.status, last_synced_at: c.last_synced_at, error: c.error || null }));

  // Needs you
  const needs: BriefingItem[] = [];
  const waiting = k.unanswered?.value || 0;
  const buying = ov?.comments?.buying_intent || 0;
  if (waiting) needs.push({ title: `${waiting} comment${waiting > 1 ? "s" : ""} waiting for a reply`, detail: buying ? `${buying} ask about price, stock or ordering.` : k.unanswered?.overdue_24h ? `${k.unanswered.overdue_24h} waited more than 24 hours.` : undefined, link: "/inbox" });
  const failed = ov?.publishing?.failed || 0;
  if (failed) needs.push({ title: `${failed} post${failed > 1 ? "s" : ""} did not go out`, detail: "Open the calendar to see why and publish again.", link: "/calendar" });
  for (const c of channels) if (c.status !== "live") needs.push({ title: `${c.platform} needs attention`, detail: c.error || "Reconnect it so Zie keeps watching.", link: "/connections" });
  for (const t of extras.guardianTasks || []) if (!needs.some((x) => x.title === t.title)) needs.push({ title: t.title, detail: t.detail, link: t.kind === "reconnect" ? "/connections" : t.kind === "reply_comments" ? "/inbox" : "/calendar" });

  // Wins and concerns from the change against the previous period
  const moves: Array<{ key: string; label: string; m: any; good: boolean }> = [
    { key: "reach", label: "Reach", m: k.reach, good: true },
    { key: "interactions", label: "Interactions", m: k.interactions, good: true },
    { key: "comments", label: "Comments", m: k.comments, good: true },
    { key: "buying", label: "Buying questions", m: k.buying_questions, good: true },
    { key: "response", label: "Response rate", m: k.response_rate, good: true },
    { key: "posts", label: "Posts published", m: k.posts, good: true },
  ];
  const wins: BriefingItem[] = [];
  const concerns: BriefingItem[] = [];
  for (const mv of moves) {
    const p = mv.m?.change_pct;
    if (p === null || p === undefined || mv.m?.value === undefined) continue;
    const item = { title: `${mv.label} ${p >= 0 ? "up" : "down"} ${Math.abs(p)}%`, metric: mv.label, delta_pct: p, detail: `${n(mv.m.value)} this week vs ${n(mv.m.previous ?? 0)} the week before.` };
    if (p >= threshold) wins.push(item);
    else if (p <= -threshold) concerns.push(item);
  }
  const fNet = k.followers?.net;
  if (typeof fNet === "number" && fNet !== 0) (fNet > 0 ? wins : concerns).push({ title: `${fNet > 0 ? "+" : ""}${n(fNet)} followers`, metric: "Followers", delta_pct: k.followers?.change_pct ?? null, detail: `${n(k.followers.value || 0)} in total.` });
  const top = ov?.content?.top?.[0];
  if (top && top.interactions > 0) wins.push({ title: `Top post: ${String(top.caption || "Untitled").slice(0, 60)}`, metric: "Interactions", detail: `${n(top.interactions)} interactions, ${String(top.format || "post").replace(/_/g, " ").toLowerCase()}.`, link: top.permalink || undefined });
  const sent = ov?.comments?.sentiment;
  const prevSent = ov?.comments?.previous_sentiment;
  if (sent && sent.negative >= 3 && sent.negative > (prevSent?.negative || 0)) concerns.push({ title: `${sent.negative} negative comments`, metric: "Sentiment", detail: `Up from ${prevSent?.negative || 0} the week before.`, link: "/inbox?filter=negative" });
  if (extras.ads?.has_data) {
    const t = extras.ads.totals || {};
    const prevRoas = extras.ads.previous?.roas || 0;
    const ch = prevRoas ? Math.round(((t.roas - prevRoas) / prevRoas) * 100) : null;
    if (ch !== null && ch <= -threshold) concerns.push({ title: `Ads return down ${Math.abs(ch)}%`, metric: "ROAS", delta_pct: ch, detail: `ROAS ${t.roas.toFixed(2)} on spend ${n(Math.round(t.spend))}.`, link: "/agent" });
    if (ch !== null && ch >= threshold) wins.push({ title: `Ads return up ${ch}%`, metric: "ROAS", delta_pct: ch, detail: `ROAS ${t.roas.toFixed(2)} on spend ${n(Math.round(t.spend))}.` });
  }

  // Three actions, ranked by what moves the business soonest
  const actions: BriefingAction[] = [];
  if (buying || waiting) {
    actions.push({
      rank: 0,
      title: buying ? `Answer ${buying} buying question${buying > 1 ? "s" : ""}` : `Reply to ${waiting} waiting comment${waiting > 1 ? "s" : ""}`,
      why: buying ? "People asking about price or stock buy when they get a fast answer." : "Replies within a few hours keep the conversation and the reach going.",
      kind: "reply_comments",
      prompt: "Triage my open comments and draft replies, buying signals first.",
      link: "/inbox",
      evidence: [{ label: "Waiting", value: waiting }, ...(buying ? [{ label: "Buying questions", value: buying }] : [])],
    });
  }
  if (failed) actions.push({ rank: 0, title: `Fix ${failed} failed post${failed > 1 ? "s" : ""}`, why: "They were scheduled but did not go out.", kind: "agent_prompt", link: "/calendar", evidence: [{ label: "Failed", value: failed }] });
  const upcoming = ov?.publishing?.upcoming || 0;
  if (upcoming < 3) {
    actions.push({
      rank: 0,
      title: upcoming ? `Plan more posts: only ${upcoming} scheduled` : "Plan this week's posts",
      why: top ? `Your best recent format is ${String(top.format || "post").replace(/_/g, " ").toLowerCase()}. Zie drafts a week from what already works.` : "A steady schedule is the simplest way to grow reach.",
      kind: "agent_prompt",
      prompt: "Plan my posts for next week.",
      evidence: [{ label: "Scheduled ahead", value: upcoming }, ...(top ? [{ label: "Best post", value: n(top.interactions) + " interactions" }] : [])],
    });
  }
  const weakFormat = (ov?.content?.by_format || []).slice().sort((a: any, b: any) => a.avg_interactions - b.avg_interactions)[0];
  if (concerns.length && actions.length < 3) {
    actions.push({ rank: 0, title: `Find out why ${concerns[0].metric?.toLowerCase() || "results"} dropped`, why: concerns[0].detail || "", kind: "agent_prompt", prompt: `Why did my ${concerns[0].metric?.toLowerCase() || "results"} drop this week? Use my real numbers.`, evidence: [{ label: concerns[0].metric || "Metric", value: pctText(concerns[0].delta_pct) }] });
  }
  if (weakFormat && (ov?.content?.by_format || []).length > 1 && actions.length < 3) {
    actions.push({ rank: 0, title: `Refresh your ${String(weakFormat.format).replace(/_/g, " ").toLowerCase()} posts`, why: `They average ${weakFormat.avg_interactions} interactions, your lowest format.`, kind: "agent_prompt", prompt: "Which of my organic post formats are wearing out?", evidence: [{ label: "Average interactions", value: weakFormat.avg_interactions }] });
  }
  if (actions.length < 3) actions.push({ rank: 0, title: "Check what competitors posted this week", why: "Spot topics and formats they win with that you have not tried.", kind: "agent_prompt", prompt: "Find the content gaps between me and my competitors.", link: "/hunt", evidence: [] });
  if (actions.length < 3) actions.push({ rank: 0, title: "Reply to your latest comments", why: "Engagement on fresh posts lifts their reach.", kind: "agent_prompt", prompt: "Triage my open comments and draft replies, buying signals first.", link: "/inbox", evidence: [] });
  if (actions.length < 3) actions.push({ rank: 0, title: "See which posts worked this month", why: "Knowing your winning format makes every next post easier.", kind: "agent_prompt", prompt: "Diagnose my content performance for the last 30 days. What worked, what did not, and why?", evidence: [] });
  const top3 = actions.slice(0, 3).map((a, i) => ({ ...a, rank: i + 1 }));

  // Summary, answer first
  const summary: string[] = [];
  if (needs.length) summary.push(`${needs.length} thing${needs.length > 1 ? "s need" : " needs"} you today, starting with: ${needs[0].title.toLowerCase()}.`);
  if (wins[0]) summary.push(`${wins[0].title}.`);
  if (concerns[0]) summary.push(`${concerns[0].title}. ${concerns[0].detail || ""}`.trim());
  if (!wins.length && !concerns.length) summary.push("A steady week: no metric moved by more than " + threshold + "% against the week before.");
  if (extras.reliability?.due) summary.push(`${extras.reliability.on_time} of ${extras.reliability.due} scheduled posts went out on time this week.`);
  const headline = needs.length ? `${needs[0].title}.` : wins[0] ? `${wins[0].title}.` : concerns[0] ? `${concerns[0].title}.` : "A steady week. Here is what to do next.";

  return {
    version: 2,
    date: extras.date,
    headline,
    summary: summary.slice(0, 4),
    needs_you: needs.slice(0, 6),
    wins: wins.slice(0, 4),
    concerns: concerns.slice(0, 4),
    actions: top3,
    channels,
    reliability: extras.reliability ? { due: extras.reliability.due, published: extras.reliability.published, on_time: extras.reliability.on_time, failed: extras.reliability.failed, on_time_rate: extras.reliability.on_time_rate } : undefined,
    ads: extras.ads?.has_data ? { spend: extras.ads.totals.spend, roas: extras.ads.totals.roas || null, change_pct: null } : null,
  };
}

async function adsSummary(userId: string) {
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const mid = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from("ad_data").select("date_range_start, spend_usd, revenue_usd").eq("user_id", userId).gte("date_range_start", since).limit(5000);
  const rows = data || [];
  if (!rows.length) return { has_data: false };
  const sum = (l: any[]) => {
    const spend = l.reduce((a, r) => a + Number(r.spend_usd || 0), 0);
    const revenue = l.reduce((a, r) => a + Number(r.revenue_usd || 0), 0);
    return { spend, revenue, roas: spend ? revenue / spend : 0 };
  };
  return { has_data: true, totals: sum(rows.filter((r: any) => r.date_range_start >= mid)), previous: sum(rows.filter((r: any) => r.date_range_start < mid)) };
}

/** Optional: let the model rewrite the summary sentences in the brand language. Numbers come only from the rules. */
async function polishSummary(b: Briefing): Promise<string[] | null> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.SUMOPOD_API_KEY) return null;
  try {
    const { getClaudeClient } = await import("../utils/instagramHelpers.js");
    const claude: any = getClaudeClient();
    const msg = await claude.messages.create({
      model: process.env.BRIEFING_MODEL || process.env.AGENT_MODEL || "claude-sonnet-4-5",
      max_tokens: 400,
      temperature: 0.2,
      system: `You rewrite a social media briefing summary so a busy business owner can read it in 10 seconds. Keep every number exactly as given, add no new facts, keep 2 to 4 short sentences, return a JSON array of strings only. ${NO_EM_DASH_RULE}`,
      messages: [{ role: "user", content: JSON.stringify({ summary: b.summary, needs_you: b.needs_you.map((x) => x.title), wins: b.wins.map((x) => x.title), concerns: b.concerns.map((x) => x.title) }) }],
    });
    const text = msg.content?.[0]?.text || "";
    const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
    if (!Array.isArray(arr) || !arr.length || arr.some((x) => typeof x !== "string")) return null;
    // Guard: the rewrite may not invent numbers
    const numsIn = (s: string) => (s.match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,]$/, ""));
    const allowed = new Set(b.summary.flatMap(numsIn).concat(b.needs_you.flatMap((x) => numsIn(x.title)), b.wins.flatMap((x) => numsIn(x.title)), b.concerns.flatMap((x) => numsIn(x.title))));
    if (arr.some((s: string) => numsIn(s).some((x) => !allowed.has(x)))) return null;
    return arr.slice(0, 4).map((s: string) => stripDashes(s));
  } catch {
    return null;
  }
}

/** Compile, store and turn the actions into approval tasks. Safe to call again the same day. */
export async function compileBriefing(userId: string, opts: { force?: boolean; date?: string } = {}): Promise<Briefing | null> {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  if (!opts.force) {
    const { data: existing } = await supabaseAdmin.from("ai_briefings").select("raw_data_snapshot").eq("user_id", userId).eq("briefing_date", date).maybeSingle();
    if (existing?.raw_data_snapshot?.briefing?.version === 2) return existing.raw_data_snapshot.briefing as Briefing;
  }
  const [ov, settings, guardianTasks, reliability, ads] = await Promise.all([
    computeOverview(userId, "7d"),
    supabaseAdmin.from("user_settings").select("alert_threshold_pct").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("agent_tasks").select("kind, title, detail").eq("user_id", userId).eq("status", "pending_approval").eq("created_by", "guardian").limit(10),
    reliabilityReport(userId, 7),
    adsSummary(userId),
  ]);
  if (!(ov as any)?.monitoring?.channels?.length) return null;
  const b = buildBriefing(ov, { date, guardianTasks: guardianTasks.data || [], reliability, ads, threshold: settings.data?.alert_threshold_pct || 25 });
  const polished = await polishSummary(b);
  if (polished) b.summary = polished;

  // Each action becomes a task the user approves, edits or dismisses
  for (const a of b.actions) {
    const r = await createAgentTask(userId, {
      kind: a.kind,
      title: a.title,
      detail: a.why,
      payload: { prompt: a.prompt, next: a.link, briefing_date: date },
      evidence: a.evidence,
      createdBy: "briefing",
      dedupeKey: `briefing:${date}:${a.rank}`,
    });
    a.task_id = (r.task as any)?.id;
  }

  await supabaseAdmin.from("ai_briefings").upsert(
    {
      user_id: userId,
      briefing_date: date,
      summary: b.summary.join(" "),
      highlights: b.wins,
      recommended_actions: b.actions.map((a) => ({ action: a.title, reason: a.why, priority: a.rank === 1 ? "high" : "medium", task_id: a.task_id })),
      anomalies_detected: b.concerns,
      raw_data_snapshot: { briefing: b },
      model_used: polished ? "rules+llm" : "rules",
      generated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,briefing_date" }
  );
  await logActivity(userId, "agent", "briefing.compiled", "briefing", date, { actions: b.actions.length, needs_you: b.needs_you.length });
  return b;
}

/** Local date and HH:MM in a time zone. Exported for tests. */
export function localNow(timeZone: string, now = new Date()): { date: string; time: string; weekday: number } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(now).map((p) => [p.type, p.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(String(parts.weekday));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, weekday: wd };
}

/** Is a briefing due for this user right now? Free plans get it on Mondays. Exported for tests. */
export function briefingDue(settings: { briefing_time: string; timezone: string }, cadence: "daily" | "weekly", lastDate: string | null, now = new Date()): { due: boolean; date: string } {
  const l = localNow(settings.timezone || "Asia/Jakarta", now);
  if (cadence === "weekly" && l.weekday !== 1) return { due: false, date: l.date };
  return { due: l.time >= (settings.briefing_time || "07:00") && lastDate !== l.date, date: l.date };
}

/** Heartbeat step: compile every briefing that is due */
export async function runDueBriefings(budgetMs = 12000) {
  const end = Date.now() + budgetMs;
  const { data: conns } = await supabaseAdmin.from("social_connections").select("user_id").eq("is_active", true).limit(5000);
  const users = [...new Set((conns || []).map((c: any) => c.user_id))];
  let compiled = 0;
  for (const userId of users) {
    if (Date.now() > end) break;
    const [{ data: st }, plan, { data: last }] = await Promise.all([
      supabaseAdmin.from("user_settings").select("briefing_time, timezone, briefing_channels").eq("user_id", userId).maybeSingle(),
      getEffectivePlan(userId),
      supabaseAdmin.from("ai_briefings").select("briefing_date").eq("user_id", userId).order("briefing_date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const due = briefingDue({ briefing_time: st?.briefing_time || "07:00", timezone: st?.timezone || "Asia/Jakarta" }, PLAN_LIMITS[plan].briefingCadence, last?.briefing_date || null);
    if (!due.due) continue;
    try {
      const b = await compileBriefing(userId, { date: due.date });
      if (b) {
        compiled++;
        if (st?.briefing_channels?.email !== false) await emailBriefing(userId, b).catch((e) => console.warn("[briefing] email failed:", e.message));
      }
    } catch (e: any) {
      // Failures are logged and retried on the next heartbeat (spec 7.2 acceptance)
      console.error(`[briefing] ${userId} failed:`, e.message);
    }
  }
  return { users: users.length, compiled };
}

/** Plain email through Mailgun when it is configured */
async function emailBriefing(userId: string, b: Briefing) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key || !domain) return;
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  const to = data?.user?.email;
  if (!to) return;
  const base = process.env.APP_URL || "https://zieads.com";
  const lines = [
    b.headline,
    "",
    ...b.summary.map((s) => `- ${s}`),
    "",
    "Actions for today:",
    ...b.actions.map((a) => `${a.rank}. ${a.title}`),
    "",
    `Approve them in ZieAds: ${base}/analyst`,
  ];
  const body = new URLSearchParams({ from: `Zie at ZieAds <briefing@${domain}>`, to, subject: `Your briefing: ${b.headline}`, text: lines.join("\n") });
  await fetch(`https://api.mailgun.net/v3/${domain}/messages`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` }, body });
}
