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

export interface ToolContext {
  userId: string;
}

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
      .select("platform, caption, media_type, scheduled_for, status, published_at, error_message")
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
      items: rows.slice(0, 30).map((r) => ({ platform: r.platform, status: r.status, when: r.scheduled_for, format: r.media_type, caption: trim(r.caption, 120), error: r.error_message || undefined })),
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

// ─── 11. Action: save a draft post ─────────────────────────────────────────
const createDraftPost: AgentTool = {
  name: "create_draft_post",
  label: "Saving a draft to your calendar",
  description:
    "Save a post as a DRAFT in the user's ZieAds content calendar so they can review it in Composer. Never publishes. Only call when the user asked you to write, plan or schedule content. Call once per post; you may call it several times in parallel for a content plan.",
  parameters: {
    type: "object",
    properties: {
      platform: { type: "string", description: "instagram, tiktok, linkedin, facebook or x" },
      caption: { type: "string", description: "The full ready-to-post caption, without hashtags" },
      hashtags: { type: "array", items: { type: "string" }, description: "Hashtags without the # sign" },
      media_type: { type: "string", enum: ["image", "video", "carousel", "reel", "text"], description: "Planned format" },
      scheduled_for: { type: "string", description: "Optional ISO date-time for the planned slot, for example 2026-10-20T09:00:00+07:00" },
    },
    required: ["platform", "caption"],
    additionalProperties: false,
  },
  async run(input, { userId }) {
    const platform = String(input?.platform || "").toLowerCase().trim();
    const caption = String(input?.caption || "").trim();
    if (!platform || !caption) throw new Error("platform and caption are required");
    if (caption.length > 5000) throw new Error("Caption is too long");
    let when: string | null = null;
    if (input?.scheduled_for) {
      const t = new Date(input.scheduled_for);
      if (!Number.isNaN(t.getTime())) when = t.toISOString();
    }
    const { data: conn } = await supabaseAdmin.from("social_connections").select("platform_user_id").eq("user_id", userId).eq("platform", platform).eq("is_active", true).maybeSingle();
    const hashtags = Array.isArray(input?.hashtags) ? input.hashtags.slice(0, 30).map((h: any) => String(h).replace(/^#/, "").trim()).filter(Boolean) : [];
    const { data, error } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_id: userId,
        platform,
        platform_account_id: conn?.platform_user_id || "",
        caption,
        media_urls: [],
        media_type: input?.media_type || "image",
        hashtags,
        scheduled_for: when,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, platform, scheduled_for, status")
      .single();
    if (error) throw new Error(error.message);
    return { saved: true, draft: data, account_connected: !!conn, note: "Saved as a draft. The user reviews and adds media in Composer before it can publish." };
  },
  summarize: (r) => `Draft saved for ${r.draft?.platform}${r.draft?.scheduled_for ? ` on ${r.draft.scheduled_for.slice(0, 10)}` : ""}`,
};

export const AGENT_TOOLS: AgentTool[] = [
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
  createDraftPost,
];

export const TOOL_MAP = new Map(AGENT_TOOLS.map((t) => [t.name, t]));
