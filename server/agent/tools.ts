/*
  ZieAds AI Agent: tools
  ----------------------
  Every tool reads (or, for create_draft_post, writes a draft) the signed-in user's own data.
  Tools always run scoped to `userId`, never to an id supplied by the model.
  Results are compact JSON so the model can reason over real numbers.
*/
import { supabaseAdmin, getRecentAuditContext, getProfile } from "../supabaseServer.js";
import { getDecryptedToken } from "../utils/tokenHelper.js";
import * as igApi from "../utils/instagramApi.js";
import { scrapeUrl } from "../scraper.js";
import { stripDashes } from "../utils/noEmDash.js";
import { computeOverview } from "../monitor/overview.js";

export interface ToolContext {
  userId: string;
  /** Viewer's UTC offset in minutes (Date.getTimezoneOffset sign flipped), used for default slots */
  tzOffsetMin?: number;
}

/** Something the agent made that the user can review and edit in the chat and in the feature */
export type AgentArtifact =
  | { kind: "post"; id: string; platform: string; caption: string; hashtags: string[]; scheduled_for: string | null; media_type: string; media_urls: string[]; status: string }
  | { kind: "reply"; id: string; platform: string; author: string; comment: string; reply: string; sentiment?: string }
  | { kind: "competitor"; id: string; name: string; website_url: string; instagram_username?: string | null };

export interface AgentTool {
  name: string;
  /** Short label shown in the UI while the tool runs */
  label: string;
  description: string;
  parameters: Record<string, any>; // JSON schema (object)
  run: (input: any, ctx: ToolContext) => Promise<any>;
  /** One-line human summary of the result for the activity panel */
  summarize?: (result: any) => string;
}

const DAY = 24 * 3600 * 1000;
const isoDaysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();
const clampInt = (v: any, def: number, min: number, max: number) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const num = (v: any) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);
const trim = (s: any, n = 220) => (typeof s === "string" ? (s.length > n ? s.slice(0, n) + "..." : s) : s);
const platformArg = {
  type: "string",
  description: "Optional platform filter, for example instagram, tiktok, linkedin. Omit for all platforms.",
};

// ─── 0. Monitoring overview (what Zie has been watching) ───────────────────
const getMonitoringOverview: AgentTool = {
  name: "get_monitoring_overview",
  label: "Checking what happened",
  description:
    "The always-on monitoring summary for the last 24h, 3d, 7d or 30d versus the previous period: comments (count, unanswered, overdue, buying questions, sentiment, recurring words), response rate and median reply time, follower change, reach, interactions, engagement rate, posts, top posts, drafts and failed posts, channel health and a timeline of what changed. Use it first for any 'what happened', 'how many comments', 'last 3 days' or 'this month' question.",
  parameters: {
    type: "object",
    properties: { period: { type: "string", enum: ["24h", "3d", "7d", "30d"], description: "Default 24h" } },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const o: any = await computeOverview(userId, (input?.period as any) || "24h");
    return { ...o, events: o.events.slice(0, 15), series: undefined, briefing: o.briefing ? { date: o.briefing.briefing_date, summary: o.briefing.summary } : null };
  },
  summarize: (r) => `${r.period}: ${r.kpis.comments.value} comments, ${r.kpis.unanswered.value} unanswered, ${r.kpis.posts.value} posts`,
};

// ─── 1. Connected accounts ─────────────────────────────────────────────────
const listConnectedAccounts: AgentTool = {
  name: "list_connected_accounts",
  label: "Checking connected accounts",
  description:
    "List every social or ads account the user has connected to ZieAds, with handle, account type and last sync time. Call this first when you need to know which channels have data.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async run(_input, { userId }) {
    const [{ data: social }, { data: accounts }] = await Promise.all([
      supabaseAdmin
        .from("social_connections")
        .select("platform, platform_username, platform_display_name, platform_account_type, connected_at, last_synced_at, token_expires_at")
        .eq("user_id", userId)
        .eq("is_active", true),
      supabaseAdmin
        .from("connected_accounts")
        .select("platform, account_handle, connection_method, last_synced_at, sync_status, sync_error_message")
        .eq("user_id", userId)
        .eq("is_active", true),
    ]);
    const map = new Map<string, any>();
    for (const c of social || []) {
      map.set(c.platform, {
        platform: c.platform,
        handle: c.platform_username,
        name: c.platform_display_name,
        account_type: c.platform_account_type,
        connected_at: c.connected_at,
        last_synced_at: c.last_synced_at,
        token_expired: c.token_expires_at ? new Date(c.token_expires_at).getTime() < Date.now() : false,
      });
    }
    for (const a of accounts || []) {
      const prev = map.get(a.platform) || { platform: a.platform, handle: a.account_handle };
      map.set(a.platform, { ...prev, connection_method: a.connection_method, sync_status: a.sync_status, sync_error: a.sync_error_message || undefined, last_synced_at: prev.last_synced_at || a.last_synced_at });
    }
    const list = [...map.values()];
    return { count: list.length, accounts: list, note: list.length ? undefined : "No accounts connected. Suggest connecting Instagram, TikTok or LinkedIn on the Connections page." };
  },
  summarize: (r) => (r.count ? `${r.count} connected: ${r.accounts.map((a: any) => a.platform).join(", ")}` : "No accounts connected yet"),
};

// ─── 2. Account metrics over time ──────────────────────────────────────────
const getAccountMetrics: AgentTool = {
  name: "get_account_metrics",
  label: "Reading account growth",
  description:
    "Daily account level metrics from connected channels (followers, reach, impressions, profile views, website clicks) for the last N days, with totals and change versus the previous period of the same length.",
  parameters: {
    type: "object",
    properties: {
      platform: platformArg,
      days: { type: "integer", description: "Look-back window in days, 7 to 90. Default 30." },
    },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const days = clampInt(input?.days, 30, 7, 90);
    let q = supabaseAdmin
      .from("account_insights_daily")
      .select("platform, snapshot_date, followers_count, impressions_daily, reach_daily, profile_views_daily, website_clicks_daily")
      .eq("user_id", userId)
      .gte("snapshot_date", isoDaysAgo(days * 2).slice(0, 10))
      .order("snapshot_date", { ascending: true });
    if (input?.platform) q = q.eq("platform", String(input.platform).toLowerCase());
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = data || [];
    if (!rows.length) return { days, platforms: [], note: "No daily account insights stored yet. The account may be newly connected or not synced." };

    const cutoff = isoDaysAgo(days).slice(0, 10);
    const byPlatform: Record<string, any[]> = {};
    for (const r of rows) (byPlatform[r.platform] ||= []).push(r);

    const platforms = Object.entries(byPlatform).map(([platform, list]) => {
      const cur = list.filter((r) => r.snapshot_date >= cutoff);
      const prev = list.filter((r) => r.snapshot_date < cutoff);
      const sum = (arr: any[], k: string) => arr.reduce((s, r) => s + num(r[k]), 0);
      const firstF = num(cur[0]?.followers_count);
      const lastF = num(cur[cur.length - 1]?.followers_count);
      const metrics: Record<string, any> = {};
      for (const k of ["impressions_daily", "reach_daily", "profile_views_daily", "website_clicks_daily"]) {
        const a = sum(cur, k);
        const b = sum(prev, k);
        metrics[k.replace("_daily", "")] = { total: a, previous_period: prev.length ? b : null, change_pct: prev.length ? pct(a, b) : null };
      }
      // Weekly sample of the series keeps the payload small
      const series = cur.filter((_, i) => i % Math.max(1, Math.floor(cur.length / 8)) === 0 || i === cur.length - 1).map((r) => ({
        date: r.snapshot_date,
        followers: num(r.followers_count),
        reach: num(r.reach_daily),
      }));
      return {
        platform,
        days_with_data: cur.length,
        followers: { start: firstF, end: lastF, net_change: lastF - firstF, change_pct: pct(lastF, firstF) },
        ...metrics,
        series,
      };
    });
    return { days, platforms };
  },
  summarize: (r) =>
    r.platforms?.length
      ? r.platforms.map((p: any) => `${p.platform}: ${p.followers.end.toLocaleString()} followers (${p.followers.net_change >= 0 ? "+" : ""}${p.followers.net_change})`).join(", ")
      : "No account history yet",
};

// ─── 3. Post performance ───────────────────────────────────────────────────
const getPostPerformance: AgentTool = {
  name: "get_post_performance",
  label: "Ranking your posts",
  description:
    "Posts published on connected channels in the last N days with caption, format, likes, comments, saves, shares, reach and engagement rate. Sorted by the chosen metric. Also returns averages by format and by weekday so you can spot what works.",
  parameters: {
    type: "object",
    properties: {
      platform: platformArg,
      days: { type: "integer", description: "Look-back window in days, 7 to 180. Default 30." },
      sort_by: { type: "string", enum: ["engagement_rate", "reach", "likes", "comments", "saves", "shares", "recent"], description: "Default engagement_rate." },
      limit: { type: "integer", description: "How many posts to return, 1 to 20. Default 8." },
    },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const days = clampInt(input?.days, 30, 7, 180);
    const limit = clampInt(input?.limit, 8, 1, 20);
    const sortBy = input?.sort_by || "engagement_rate";

    let q = supabaseAdmin
      .from("social_posts")
      .select("id, platform, platform_post_id, post_url, content_text, media_type, posted_at, raw_metrics")
      .eq("user_id", userId)
      .gte("posted_at", isoDaysAgo(days))
      .order("posted_at", { ascending: false })
      .limit(120);
    if (input?.platform) q = q.eq("platform", String(input.platform).toLowerCase());
    const { data: posts, error } = await q;
    if (error) throw new Error(error.message);

    // Insight caches keyed by platform media id (TikTok and Instagram sync both write here)
    const ids = (posts || []).map((p) => p.platform_post_id);
    const { data: cache } = ids.length
      ? await supabaseAdmin
          .from("post_insights_cache")
          .select("platform_media_id, impressions, reach, likes, comments_count, saves, shares, video_views, plays")
          .eq("user_id", userId)
          .in("platform_media_id", ids)
      : { data: [] as any[] };
    const cacheMap = new Map((cache || []).map((c: any) => [c.platform_media_id, c]));

    const rows = (posts || []).map((p) => {
      const m = (p.raw_metrics || {}) as Record<string, any>;
      const c: any = cacheMap.get(p.platform_post_id) || {};
      const likes = num(c.likes ?? m.likes);
      const comments = num(c.comments_count ?? m.comments);
      const saves = num(c.saves ?? m.saved ?? m.saves);
      const shares = num(c.shares ?? m.shares);
      const reach = num(c.reach ?? m.reach);
      const views = num(c.video_views ?? c.plays ?? m.views ?? m.plays ?? c.impressions ?? m.impressions);
      const interactions = likes + comments + saves + shares;
      const engagement_rate = reach ? Math.round((interactions / reach) * 10000) / 100 : null;
      return {
        platform: p.platform,
        posted_at: p.posted_at,
        weekday: new Date(p.posted_at).toLocaleDateString("en-US", { weekday: "short" }),
        format: (m.media_product_type || p.media_type || "post").toString().toLowerCase(),
        caption: trim(p.content_text, 160),
        url: p.post_url || m.permalink || undefined,
        likes,
        comments,
        saves,
        shares,
        reach,
        views,
        interactions,
        engagement_rate,
      };
    });

    if (!rows.length) return { days, total_posts: 0, note: "No posts stored for this window. The account may not be synced yet." };

    const key = sortBy === "recent" ? null : sortBy;
    const sorted = key ? [...rows].sort((a: any, b: any) => num(b[key]) - num(a[key])) : rows;

    const group = (k: "format" | "weekday") => {
      const g: Record<string, { posts: number; avg_interactions: number; avg_reach: number }> = {};
      for (const r of rows) {
        const x = (g[r[k]] ||= { posts: 0, avg_interactions: 0, avg_reach: 0 });
        x.posts++;
        x.avg_interactions += r.interactions;
        x.avg_reach += r.reach;
      }
      for (const x of Object.values(g)) {
        x.avg_interactions = Math.round(x.avg_interactions / x.posts);
        x.avg_reach = Math.round(x.avg_reach / x.posts);
      }
      return g;
    };
    const totals = rows.reduce((s, r) => ({ interactions: s.interactions + r.interactions, reach: s.reach + r.reach }), { interactions: 0, reach: 0 });

    return {
      days,
      total_posts: rows.length,
      posts_per_week: Math.round((rows.length / days) * 7 * 10) / 10,
      avg_interactions_per_post: Math.round(totals.interactions / rows.length),
      avg_reach_per_post: Math.round(totals.reach / rows.length),
      by_format: group("format"),
      by_weekday: group("weekday"),
      sorted_by: sortBy,
      posts: sorted.slice(0, limit),
      weakest: key ? sorted.slice(-Math.min(3, Math.max(0, sorted.length - limit))).reverse() : undefined,
    };
  },
  summarize: (r) => (r.total_posts ? `${r.total_posts} posts analysed, ${r.posts_per_week}/week, avg ${r.avg_interactions_per_post} interactions` : "No posts in this window"),
};

// ─── 4. Live Instagram snapshot (fresh from the API) ───────────────────────
const getLiveInstagram: AgentTool = {
  name: "get_live_instagram",
  label: "Pulling live Instagram data",
  description:
    "Fetch fresh data straight from the Instagram API for the connected account: profile (followers, posts, bio) and the latest posts with like and comment counts. Use when the user asks about right now or when stored data looks stale.",
  parameters: {
    type: "object",
    properties: { limit: { type: "integer", description: "Number of latest posts, 1 to 25. Default 12." } },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const conn = await getDecryptedToken(userId, "instagram");
    if (!conn) return { connected: false, note: "Instagram is not connected." };
    const limit = clampInt(input?.limit, 12, 1, 25);
    const [profile, media] = await Promise.all([igApi.getProfile(conn.token), igApi.getRecentMedia(conn.token, limit)]);
    const posts = (media?.data || []).map((m: any) => ({
      posted_at: m.timestamp,
      format: (m.media_product_type || m.media_type || "").toLowerCase(),
      caption: trim(m.caption, 160),
      likes: num(m.like_count),
      comments: num(m.comments_count),
      url: m.permalink,
    }));
    const avgLikes = posts.length ? Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length) : 0;
    const p: any = profile || {};
    return {
      connected: true,
      fetched_at: new Date().toISOString(),
      profile: { username: p.username, name: p.name, account_type: p.account_type, followers: num(p.followers_count), following: num(p.follows_count), total_posts: num(p.media_count), bio: trim(p.biography, 200), website: p.website },
      avg_likes_latest: avgLikes,
      like_rate_pct: p.followers_count ? Math.round((avgLikes / num(p.followers_count)) * 10000) / 100 : null,
      latest_posts: posts,
    };
  },
  summarize: (r) => (r.connected ? `@${r.profile.username}: ${r.profile.followers.toLocaleString()} followers, ${r.latest_posts.length} latest posts` : "Instagram not connected"),
};

// ─── 5. Inbox / comments ───────────────────────────────────────────────────
const getInboxSummary: AgentTool = {
  name: "get_inbox_summary",
  label: "Scanning your inbox",
  description:
    "Comments from connected channels: counts by sentiment and status, unanswered questions, and the latest negative or unanswered comments with their text.",
  parameters: {
    type: "object",
    properties: {
      platform: platformArg,
      days: { type: "integer", description: "Look-back window in days, 1 to 60. Default 14." },
    },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const days = clampInt(input?.days, 14, 1, 60);
    let q = supabaseAdmin
      .from("comments_inbox")
      .select("platform, author_username, text, sentiment, status, replied_at, posted_at, created_at")
      .eq("user_id", userId)
      .gte("created_at", isoDaysAgo(days))
      .order("created_at", { ascending: false })
      .limit(300);
    if (input?.platform) q = q.eq("platform", String(input.platform).toLowerCase());
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = data || [];
    const count = (fn: (r: any) => boolean) => rows.filter(fn).length;
    const unanswered = rows.filter((r) => !r.replied_at && r.status !== "replied" && r.status !== "archived");
    const questions = unanswered.filter((r) => /\?|how|price|harga|berapa|where|kapan|when|ship|order/i.test(r.text || ""));
    const pick = (arr: any[], n: number) => arr.slice(0, n).map((r) => ({ platform: r.platform, from: r.author_username, text: trim(r.text, 180), sentiment: r.sentiment, at: r.posted_at || r.created_at }));
    return {
      days,
      total: rows.length,
      sentiment: { positive: count((r) => r.sentiment === "positive"), neutral: count((r) => r.sentiment === "neutral"), negative: count((r) => r.sentiment === "negative") },
      unanswered: unanswered.length,
      unanswered_questions: questions.length,
      latest_questions: pick(questions, 6),
      latest_negative: pick(rows.filter((r) => r.sentiment === "negative"), 5),
    };
  },
  summarize: (r) => `${r.total} comments, ${r.unanswered} unanswered, ${r.sentiment?.negative || 0} negative`,
};

// ─── 6. Content calendar ───────────────────────────────────────────────────
const getContentCalendar: AgentTool = {
  name: "get_content_calendar",
  label: "Checking the content calendar",
  description: "Scheduled, draft, published and failed posts in the calendar, from N days back to N days ahead, with gaps (days with nothing scheduled).",
  parameters: {
    type: "object",
    properties: {
      days_ahead: { type: "integer", description: "Days ahead to include, 1 to 60. Default 14." },
      days_back: { type: "integer", description: "Days back to include, 0 to 30. Default 7." },
    },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const ahead = clampInt(input?.days_ahead, 14, 1, 60);
    const back = clampInt(input?.days_back, 7, 0, 30);
    const { data, error } = await supabaseAdmin
      .from("scheduled_posts")
      .select("id, platform, caption, media_type, scheduled_for, status, published_at, error_message")
      .eq("user_id", userId)
      .or(`scheduled_for.gte."${isoDaysAgo(back)}",scheduled_for.is.null`)
      .order("scheduled_for", { ascending: true, nullsFirst: false })
      .limit(80);
    if (error) throw new Error(error.message);
    const end = Date.now() + ahead * DAY;
    const rows = (data || []).filter((r) => !r.scheduled_for || new Date(r.scheduled_for).getTime() <= end);
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    const upcomingDays = new Set(rows.filter((r) => r.scheduled_for && new Date(r.scheduled_for).getTime() > Date.now()).map((r) => r.scheduled_for.slice(0, 10)));
    const gaps: string[] = [];
    for (let i = 1; i <= Math.min(ahead, 14); i++) {
      const d = new Date(Date.now() + i * DAY).toISOString().slice(0, 10);
      if (!upcomingDays.has(d)) gaps.push(d);
    }
    return {
      window: { days_back: back, days_ahead: ahead },
      by_status: byStatus,
      empty_days_next_2_weeks: gaps,
      items: rows.slice(0, 30).map((r: any) => ({ id: r.id, platform: r.platform, status: r.status, when: r.scheduled_for, format: r.media_type, caption: trim(r.caption, 120), error: r.error_message || undefined })),
    };
  },
  summarize: (r) => `${Object.entries(r.by_status || {}).map(([k, v]) => `${v} ${k}`).join(", ") || "Calendar empty"}; ${r.empty_days_next_2_weeks?.length || 0} empty days ahead`,
};

// ─── 7. Competitors ────────────────────────────────────────────────────────
const getCompetitors: AgentTool = {
  name: "get_competitors",
  label: "Reviewing competitors",
  description: "Competitors the user tracks in Competitor Hunt, with their latest audit score, handles and key findings.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async run(_input, { userId }) {
    const [{ data: a }, { data: b }] = await Promise.all([
      supabaseAdmin.from("competitors").select("name, website_url, instagram_username, audit_score, last_audited_at, audit_report").eq("user_id", userId).limit(10),
      supabaseAdmin.from("tracked_competitors").select("competitor_name, competitor_url, competitor_handle, latest_audit_score, last_audited_at").eq("user_id", userId).eq("is_active", true).limit(10),
    ]);
    const list = [
      ...(a || []).map((c: any) => ({
        name: c.name,
        website: c.website_url,
        instagram: c.instagram_username,
        score: c.audit_score,
        last_audited_at: c.last_audited_at,
        highlights: trim(JSON.stringify(c.audit_report?.summary || c.audit_report?.findings?.slice?.(0, 3) || ""), 400) || undefined,
      })),
      ...(b || []).map((c: any) => ({ name: c.competitor_name, website: c.competitor_url, instagram: c.competitor_handle, score: c.latest_audit_score, last_audited_at: c.last_audited_at })),
    ];
    return { count: list.length, competitors: list, note: list.length ? undefined : "No competitors tracked yet. Suggest adding some in Competitor Hunt." };
  },
  summarize: (r) => (r.count ? `${r.count} competitors: ${r.competitors.slice(0, 3).map((c: any) => c.name).join(", ")}` : "No competitors tracked"),
};

// ─── 8. AI Analyst briefing ────────────────────────────────────────────────
const getLatestBriefing: AgentTool = {
  name: "get_latest_briefing",
  label: "Reading today's briefing",
  description: "The most recent AI Analyst morning briefing: summary, highlights, anomalies and recommended actions.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async run(_input, { userId }) {
    const { data } = await supabaseAdmin
      .from("ai_briefings")
      .select("briefing_date, summary, highlights, recommended_actions, anomalies_detected")
      .eq("user_id", userId)
      .order("briefing_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { available: false, note: "No briefing generated yet." };
    return { available: true, ...data, summary: trim(data.summary, 1200) };
  },
  summarize: (r) => (r.available ? `Briefing from ${r.briefing_date}` : "No briefing yet"),
};

// ─── 9. Website audit + business profile ───────────────────────────────────
const getAuditAndProfile: AgentTool = {
  name: "get_audit_and_profile",
  label: "Loading audit and brand profile",
  description: "The user's business profile from onboarding (business, goals, budget, platforms) plus the latest website audit scores and findings.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async run(_input, { userId }) {
    const [profile, audit] = await Promise.all([getProfile(userId), getRecentAuditContext(userId)]);
    const p: any = profile || {};
    return {
      profile: {
        business_name: p.business_name,
        business_type: p.business_type,
        website: p.primary_url,
        monthly_budget: p.monthly_budget,
        role: p.role,
        goals: p.goals || p.primary_goal,
        platforms: p.platforms_in_focus || p.platforms,
        challenge: p.challenge,
      },
      audit: trim(audit, 2500),
    };
  },
  summarize: (r) => `${r.profile?.business_name || "Profile"} loaded${r.audit && !String(r.audit).startsWith("No audit") ? " with audit" : ""}`,
};

// ─── 10. Website scan (live) ───────────────────────────────────────────────
const scanWebsite: AgentTool = {
  name: "scan_website",
  label: "Scanning the website",
  description:
    "Open a public web page and read its ads readiness signals: title, headline, offer, primary CTA, tracking pixels installed (Meta, Google, TikTok and more), lead forms, pricing and load time. Use for the user's site or a competitor's site.",
  parameters: {
    type: "object",
    properties: { url: { type: "string", description: "Full URL or domain, for example glowskin.co" } },
    required: ["url"],
    additionalProperties: false,
  },
  async run(input) {
    let url = String(input?.url || "").trim();
    if (!url) throw new Error("url is required");
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const host = new URL(url).hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || host.endsWith(".internal")) throw new Error("Private addresses cannot be scanned");
    const d = await Promise.race([scrapeUrl(url), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Website took too long to respond")), 15000))]);
    return {
      url: d.url,
      title: d.title,
      h1: d.h1,
      meta_description: trim(d.metaDescription, 200),
      hero_offer: trim(d.heroOffer, 200),
      primary_cta: d.primaryCTA,
      pixels_detected: d.detectedPixels,
      missing_key_pixels: ["Meta Pixel", "Google Analytics", "TikTok Pixel"].filter((p) => !d.detectedPixels.includes(p)),
      business_signals: d.businessSignals,
      inferred_business_type: d.inferredBusinessType,
      load_time_ms: d.pageLoadTime,
      headings: d.headings.slice(0, 8),
    };
  },
  summarize: (r) => `${r.url}: ${r.pixels_detected?.length || 0} pixels, loads in ${(r.load_time_ms / 1000).toFixed(1)}s`,
};

// ─── Shared helpers for action tools ───────────────────────────────────────
const cleanText = (v: any, max: number) => stripDashes(String(v ?? "").trim()).slice(0, max);
const cleanTags = (v: any) =>
  Array.isArray(v) ? v.slice(0, 30).map((h: any) => String(h).replace(/^#/, "").replace(/\s+/g, "").trim()).filter(Boolean) : [];

/** Next free 9:00 local slot from tomorrow, used when the model gives no time */
function defaultSlot(offsetMin: number, dayIndex: number) {
  const now = new Date(Date.now() + offsetMin * 60000);
  const local = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1 + dayIndex, 9, 0, 0));
  return new Date(local.getTime() - offsetMin * 60000).toISOString();
}

const postArtifact = (row: any): AgentArtifact => ({
  kind: "post",
  id: row.id,
  platform: row.platform,
  caption: row.caption || "",
  hashtags: row.hashtags || [],
  scheduled_for: row.scheduled_for,
  media_type: row.media_type || "image",
  media_urls: row.media_urls || [],
  status: row.status,
});

// ─── 11. Action: draft posts straight into the schedule ────────────────────
const createDraftPosts: AgentTool = {
  name: "create_draft_posts",
  label: "Adding drafts to your schedule",
  description:
    "Write one or more posts and place them in the user's content calendar as DRAFTS on specific dates and times. Drafts never publish on their own: the user reviews, edits, adds media and approves them in the chat, the Calendar or Composer. Use for any request to create, plan, write or schedule content. Put a whole content plan in ONE call.",
  parameters: {
    type: "object",
    properties: {
      posts: {
        type: "array",
        description: "The posts to add, 1 to 14",
        items: {
          type: "object",
          properties: {
            platform: { type: "string", description: "instagram, tiktok, linkedin, facebook or x" },
            caption: { type: "string", description: "Full ready-to-post caption without hashtags" },
            hashtags: { type: "array", items: { type: "string" }, description: "Hashtags without #" },
            media_type: { type: "string", enum: ["image", "video", "carousel", "reel", "text"] },
            scheduled_for: { type: "string", description: "ISO date-time with timezone offset for the slot, for example 2026-10-20T09:00:00+07:00" },
            media_ids: { type: "array", items: { type: "string" }, description: "Optional media library ids from list_media_library" },
          },
          required: ["platform", "caption"],
        },
      },
    },
    required: ["posts"],
    additionalProperties: false,
  },
  async run(input, { userId, tzOffsetMin = 0 }) {
    const list = Array.isArray(input?.posts) ? input.posts.slice(0, 14) : input?.caption ? [input] : [];
    if (!list.length) throw new Error("posts is required");

    const { data: conns } = await supabaseAdmin.from("social_connections").select("platform, platform_user_id").eq("user_id", userId).eq("is_active", true);
    const accountFor = new Map((conns || []).map((c: any) => [c.platform, c.platform_user_id]));

    // Resolve media ids once
    const allIds = [...new Set(list.flatMap((p: any) => (Array.isArray(p.media_ids) ? p.media_ids : [])))].slice(0, 50);
    const { data: media } = allIds.length
      ? await supabaseAdmin.from("media_library").select("id, blob_url, mime_type").eq("user_id", userId).in("id", allIds)
      : { data: [] as any[] };
    const mediaMap = new Map((media || []).map((m: any) => [m.id, m]));

    const rows = list.map((p: any, i: number) => {
      const platform = String(p.platform || "instagram").toLowerCase().trim();
      let when: string | null = null;
      if (p.scheduled_for) {
        const t = new Date(p.scheduled_for);
        if (!Number.isNaN(t.getTime()) && t.getTime() > Date.now()) when = t.toISOString();
      }
      const picked = (Array.isArray(p.media_ids) ? p.media_ids : []).map((id: string) => mediaMap.get(id)).filter(Boolean);
      return {
        user_id: userId,
        platform,
        platform_account_id: accountFor.get(platform) || "",
        caption: cleanText(p.caption, 5000),
        media_urls: picked.map((m: any) => m.blob_url),
        media_type: picked.length ? (String(picked[0].mime_type || "").startsWith("video/") ? "video" : picked.length > 1 ? "carousel" : "image") : p.media_type || "image",
        hashtags: cleanTags(p.hashtags),
        scheduled_for: when || defaultSlot(tzOffsetMin, i),
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    if (rows.some((r: any) => !r.caption)) throw new Error("Every post needs a caption");

    const { data, error } = await supabaseAdmin.from("scheduled_posts").insert(rows).select("*");
    if (error) throw new Error(error.message);
    const artifacts = (data || []).map(postArtifact);
    return {
      saved: artifacts.length,
      drafts: artifacts.map((a: any) => ({ id: a.id, platform: a.platform, scheduled_for: a.scheduled_for })),
      platforms_not_connected: [...new Set(rows.filter((r: any) => !r.platform_account_id).map((r: any) => r.platform))],
      note: "Saved as drafts on the calendar. The user reviews, adds media and approves them. Nothing is published automatically.",
      _artifacts: artifacts,
    };
  },
  summarize: (r) => `${r.saved} ${r.saved === 1 ? "draft" : "drafts"} added to the calendar`,
};

// ─── 12. Action: edit drafts the agent (or user) made ──────────────────────
const updateDraftPost: AgentTool = {
  name: "update_draft_post",
  label: "Updating a draft",
  description: "Edit a DRAFT post in the calendar: caption, hashtags or planned time. Use the id from get_content_calendar or from drafts you created. Only drafts can be edited this way.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string" },
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
      scheduled_for: { type: "string", description: "New ISO date-time with offset" },
    },
    required: ["id"],
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const { data: post } = await supabaseAdmin.from("scheduled_posts").select("*").eq("id", String(input?.id || "")).eq("user_id", userId).maybeSingle();
    if (!post) throw new Error("Draft not found");
    if (post.status !== "draft") throw new Error(`This post is ${post.status}; only drafts can be edited by the agent`);
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.caption !== undefined) updates.caption = cleanText(input.caption, 5000);
    if (input.hashtags !== undefined) updates.hashtags = cleanTags(input.hashtags);
    if (input.scheduled_for) {
      const t = new Date(input.scheduled_for);
      if (!Number.isNaN(t.getTime())) updates.scheduled_for = t.toISOString();
    }
    const { data, error } = await supabaseAdmin.from("scheduled_posts").update(updates).eq("id", post.id).select("*").single();
    if (error) throw new Error(error.message);
    return { updated: true, id: data.id, _artifacts: [postArtifact(data)] };
  },
  summarize: () => "Draft updated",
};

// ─── 13. Media library ─────────────────────────────────────────────────────
const listMediaLibrary: AgentTool = {
  name: "list_media_library",
  label: "Browsing your media library",
  description: "Recent images and videos in the user's ZieAds media library, with ids you can attach to drafts.",
  parameters: { type: "object", properties: { limit: { type: "integer", description: "1 to 30, default 12" } }, additionalProperties: false },
  async run(input, { userId }) {
    const { data, error } = await supabaseAdmin
      .from("media_library")
      .select("id, file_name, mime_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(clampInt(input?.limit, 12, 1, 30));
    if (error) throw new Error(error.message);
    return { count: (data || []).length, media: (data || []).map((m: any) => ({ id: m.id, name: m.file_name, type: String(m.mime_type || "").split("/")[0], added: m.created_at })) };
  },
  summarize: (r) => `${r.count} media files`,
};

// ─── 14. Comments with ids (for analysis and replies) ──────────────────────
const listComments: AgentTool = {
  name: "list_comments",
  label: "Reading your comments",
  description:
    "Individual comments from the Inbox with their id, author, text, sentiment, status and any saved draft reply. Use for comment analysis and before drafting replies.",
  parameters: {
    type: "object",
    properties: {
      filter: { type: "string", enum: ["unanswered", "negative", "questions", "positive", "all"], description: "Default unanswered" },
      platform: platformArg,
      days: { type: "integer", description: "Look-back window 1 to 60 days, default 30" },
      limit: { type: "integer", description: "1 to 40, default 20" },
    },
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const filter = input?.filter || "unanswered";
    let q = supabaseAdmin
      .from("comments_inbox")
      .select("id, platform, author_username, text, sentiment, status, reply_text, replied_at, posted_at, created_at")
      .eq("user_id", userId)
      .neq("status", "archived")
      .gte("created_at", isoDaysAgo(clampInt(input?.days, 30, 1, 60)))
      .order("created_at", { ascending: false })
      .limit(200);
    if (input?.platform) q = q.eq("platform", String(input.platform).toLowerCase());
    if (filter === "negative" || filter === "positive") q = q.eq("sentiment", filter);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    let rows = data || [];
    if (filter === "unanswered" || filter === "questions") rows = rows.filter((r: any) => r.status !== "replied" && !r.replied_at);
    if (filter === "questions") rows = rows.filter((r: any) => /\?|how|price|harga|berapa|where|dimana|kapan|when|ship|order|stock|ready/i.test(r.text || ""));
    const limit = clampInt(input?.limit, 20, 1, 40);
    return {
      filter,
      matched: rows.length,
      comments: rows.slice(0, limit).map((r: any) => ({
        id: r.id,
        platform: r.platform,
        from: r.author_username,
        text: trim(r.text, 300),
        sentiment: r.sentiment,
        status: r.status,
        draft_reply: r.status !== "replied" && r.reply_text ? r.reply_text : undefined,
        at: r.posted_at || r.created_at,
      })),
    };
  },
  summarize: (r) => `${r.matched} ${r.filter} comments`,
};

// ─── 15. Action: draft replies into the Inbox ──────────────────────────────
const draftCommentReplies: AgentTool = {
  name: "draft_comment_replies",
  label: "Drafting replies in your Inbox",
  description:
    "Save suggested replies on Inbox comments. Replies are NOT sent: they appear pre-filled in the Inbox and in the chat so the user can edit and send each one. Use ids from list_comments. Write replies in the commenter's language and the brand's voice.",
  parameters: {
    type: "object",
    properties: {
      replies: {
        type: "array",
        items: { type: "object", properties: { comment_id: { type: "string" }, reply: { type: "string" } }, required: ["comment_id", "reply"] },
        description: "1 to 25 replies",
      },
    },
    required: ["replies"],
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const list = (Array.isArray(input?.replies) ? input.replies : []).slice(0, 25).filter((r: any) => r?.comment_id && r?.reply);
    if (!list.length) throw new Error("replies is required");
    const ids = list.map((r: any) => String(r.comment_id));
    const { data: comments } = await supabaseAdmin.from("comments_inbox").select("id, platform, author_username, text, sentiment, status").eq("user_id", userId).in("id", ids);
    const byId = new Map((comments || []).map((c: any) => [c.id, c]));
    const artifacts: AgentArtifact[] = [];
    const skipped: string[] = [];
    await Promise.all(
      list.map(async (r: any) => {
        const c: any = byId.get(String(r.comment_id));
        if (!c || c.status === "replied") {
          skipped.push(String(r.comment_id));
          return;
        }
        const reply = cleanText(r.reply, 2200);
        const { error } = await supabaseAdmin.from("comments_inbox").update({ reply_text: reply }).eq("id", c.id).eq("user_id", userId);
        if (error) {
          skipped.push(c.id);
          return;
        }
        artifacts.push({ kind: "reply", id: c.id, platform: c.platform, author: c.author_username, comment: c.text, reply, sentiment: c.sentiment });
      }),
    );
    return { drafted: artifacts.length, skipped, note: "Replies are saved as drafts in the Inbox. The user sends them.", _artifacts: artifacts };
  },
  summarize: (r) => `${r.drafted} ${r.drafted === 1 ? "reply" : "replies"} drafted${r.skipped?.length ? `, ${r.skipped.length} skipped` : ""}`,
};

// ─── 16. Action: track a competitor in Competitor Hunt ─────────────────────
const addCompetitor: AgentTool = {
  name: "add_competitor",
  label: "Adding a competitor to Hunt",
  description: "Start tracking a competitor in Competitor Hunt. Only add competitors the user named or clearly asked you to find. Max 25 tracked.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      website_url: { type: "string", description: "Homepage URL" },
      instagram_username: { type: "string", description: "Optional handle without @" },
    },
    required: ["name", "website_url"],
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const name = cleanText(input?.name, 100);
    let url = String(input?.website_url || "").trim();
    if (!name || !url) throw new Error("name and website_url are required");
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    url = url.replace(/^http:\/\//i, "https://");
    const handle = input?.instagram_username ? String(input.instagram_username).replace(/^@/, "").trim() : null;
    const { count } = await supabaseAdmin.from("competitors").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((count || 0) >= 25) throw new Error("Competitor limit of 25 reached");
    const { data: dup } = await supabaseAdmin.from("competitors").select("id, name, website_url, instagram_username").eq("user_id", userId).eq("website_url", url).maybeSingle();
    if (dup) return { added: false, already_tracked: true, _artifacts: [{ kind: "competitor", ...dup }] };
    const { data, error } = await supabaseAdmin.from("competitors").insert({ user_id: userId, name, website_url: url, instagram_username: handle }).select("id, name, website_url, instagram_username").single();
    if (error) throw new Error(error.message);
    return { added: true, competitor: data, _artifacts: [{ kind: "competitor", ...data }] };
  },
  summarize: (r) => (r.added ? `Now tracking ${r.competitor?.name}` : "Already tracked"),
};

export const AGENT_TOOLS: AgentTool[] = [
  getMonitoringOverview,
  listConnectedAccounts,
  getAccountMetrics,
  getPostPerformance,
  getLiveInstagram,
  getInboxSummary,
  getContentCalendar,
  getCompetitors,
  getLatestBriefing,
  getAuditAndProfile,
  scanWebsite,
  listComments,
  listMediaLibrary,
  createDraftPosts,
  updateDraftPost,
  draftCommentReplies,
  addCompetitor,
];

export const TOOL_MAP = new Map(AGENT_TOOLS.map((t) => [t.name, t]));
