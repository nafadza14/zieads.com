/*
  Superadmin insights: the numbers behind the admin dashboard, all read from real tables (no sample data).
  Mounted at /api/superadmin/v1 next to the existing superadmin routes, behind the same session check.
    GET /insights/overview?days=30   users, signups per day, funnel, plans and MRR, connections,
                                     publishing, engagement, workspaces and what needs attention
    GET /insights/users              accounts with plan, last seen, accounts, posts, brands, health
    GET /insights/users/:id          one account: brands, connections, recent posts, activity, usage
  An account is a person who signs in. Extra brand workspaces have hidden data users; their numbers
  are rolled up into the owner account, and they never show as separate users.
*/
import express from "express";
import { supabaseAdmin } from "../supabaseServer.js";
import { superadminAuthMiddleware } from "./api-superadmin.js";

export const insightsRouter = express.Router();

const PRICE: Record<string, number> = { free: 0, starter: 29, pro: 79, agency: 199 };
const DAY = 86400000;
const iso = (d: number | Date) => new Date(d).toISOString();
const dayKey = (d: string | number | Date) => new Date(d).toISOString().slice(0, 10);

/** Reads every row of a query in pages of 1000 (the API's page size). Missing tables give []. */
async function all<T = any>(build: () => any, max = 50000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    try {
      const { data, error } = await build().range(from, from + 999);
      if (error || !data) break;
      out.push(...data);
      if (data.length < 1000) break;
    } catch {
      break;
    }
  }
  return out;
}

async function count(build: () => any): Promise<number> {
  try {
    const { count: n } = await build();
    return n || 0;
  } catch {
    return 0;
  }
}

/** Every auth user, paged */
async function authUsers(): Promise<any[]> {
  const out: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    out.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return out;
}

interface Ctx {
  accounts: any[];
  ownerOf: Map<string, string>;
  dataUsersOf: Map<string, string[]>;
  plans: Map<string, string>;
  profiles: Map<string, any>;
}

let ctxCache: { at: number; ctx: Ctx } | null = null;

/** Accounts (people) and the map from each workspace data user to its owner */
async function context(): Promise<Ctx> {
  if (ctxCache && Date.now() - ctxCache.at < 30000) return ctxCache.ctx;
  const [users, ws, planRows, profileRows] = await Promise.all([
    authUsers(),
    all(() => supabaseAdmin.from("workspaces").select("owner_id, data_user_id, name")),
    all(() => supabaseAdmin.from("user_plan").select("user_id, plan_id, plan_started_at")),
    all(() => supabaseAdmin.from("profiles").select("id, business_name, business_type, primary_url")),
  ]);
  const ownerOf = new Map<string, string>();
  const dataUsersOf = new Map<string, string[]>();
  for (const w of ws) {
    ownerOf.set(w.data_user_id, w.owner_id);
    dataUsersOf.set(w.owner_id, [...(dataUsersOf.get(w.owner_id) || []), w.data_user_id]);
  }
  const accounts = users.filter((u) => u.app_metadata?.kind !== "workspace");
  for (const a of accounts) {
    ownerOf.set(a.id, a.id);
    if (!dataUsersOf.get(a.id)?.includes(a.id)) dataUsersOf.set(a.id, [a.id, ...(dataUsersOf.get(a.id) || [])]);
  }
  const ctx: Ctx = {
    accounts,
    ownerOf,
    dataUsersOf,
    plans: new Map(planRows.map((p) => [p.user_id, p.plan_id || "free"])),
    profiles: new Map(profileRows.map((p) => [p.id, p])),
  };
  ctxCache = { at: Date.now(), ctx };
  return ctx;
}

const isBanned = (u: any) => (u.banned_until && new Date(u.banned_until).getTime() > Date.now()) || u.user_metadata?.is_banned === true;

/** Per account activity over the last `days` days, rolled up across its brands */
async function activity(ctx: Ctx, days: number) {
  const since = iso(Date.now() - days * DAY);
  const [posts, conns, comments, msgs, ws] = await Promise.all([
    all(() => supabaseAdmin.from("scheduled_posts").select("user_id, platform, status, created_at, published_at, scheduled_for, error_message").gte("created_at", since)),
    all(() => supabaseAdmin.from("social_connections").select("user_id, platform, status, is_active, last_error_message")),
    all(() => supabaseAdmin.from("comments_inbox").select("user_id, status, created_at").gte("created_at", since)),
    all(() => supabaseAdmin.from("agent_messages").select("user_id, role, created_at").gte("created_at", since)),
    all(() => supabaseAdmin.from("workspaces").select("owner_id, data_user_id")),
  ]);
  const owner = (id: string) => ctx.ownerOf.get(id) || id;
  const per = new Map<string, { published: number; failed: number; needs_action: number; scheduled: number; platforms: Set<string>; connections: number; reconnect: number; comments: number; replies: number; agent: number; brands: number }>();
  const get = (id: string) => {
    let v = per.get(id);
    if (!v) {
      v = { published: 0, failed: 0, needs_action: 0, scheduled: 0, platforms: new Set(), connections: 0, reconnect: 0, comments: 0, replies: 0, agent: 0, brands: 1 };
      per.set(id, v);
    }
    return v;
  };
  for (const p of posts) {
    const v = get(owner(p.user_id));
    if (p.status === "published") v.published++;
    else if (p.status === "failed") v.failed++;
    else if (p.status === "needs_action") v.needs_action++;
    else if (p.status === "scheduled") v.scheduled++;
  }
  for (const c of conns.filter((c) => c.is_active)) {
    const v = get(owner(c.user_id));
    v.connections++;
    v.platforms.add(c.platform);
    if (c.status === "needs_reconnect" || c.status === "expired") v.reconnect++;
  }
  for (const c of comments) {
    const v = get(owner(c.user_id));
    v.comments++;
    if (c.status === "replied") v.replies++;
  }
  for (const m of msgs) if (m.role === "user") get(owner(m.user_id)).agent++;
  for (const w of ws) if (w.data_user_id !== w.owner_id) get(w.owner_id).brands++;
  return { per, posts, conns, comments, msgs };
}

insightsRouter.get("/insights/overview", superadminAuthMiddleware, async (req, res) => {
  try {
    const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
    const ctx = await context();
    const now = Date.now();
    const accounts = ctx.accounts;
    const planOf = (id: string) => ctx.plans.get(id) || "free";
    const byPlan: Record<string, number> = { free: 0, starter: 0, pro: 0, agency: 0 };
    for (const a of accounts) byPlan[planOf(a.id)] = (byPlan[planOf(a.id)] || 0) + 1;
    const paid = accounts.filter((a) => planOf(a.id) !== "free").length;
    const mrr = accounts.reduce((s, a) => s + (PRICE[planOf(a.id)] || 0), 0);
    const seen = (a: any, d: number) => a.last_sign_in_at && now - new Date(a.last_sign_in_at).getTime() < d * DAY;

    // Signups per day
    const series: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) series.push({ date: dayKey(now - i * DAY), count: 0 });
    const idx = new Map(series.map((s, i) => [s.date, i]));
    for (const a of accounts) {
      const i = idx.get(dayKey(a.created_at));
      if (i !== undefined) series[i].count++;
    }
    const newInRange = series.reduce((s, x) => s + x.count, 0);
    const prevNew = accounts.filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t < now - days * DAY && t >= now - 2 * days * DAY;
    }).length;

    const act = await activity(ctx, days);
    const everPosted = new Set(
      (await all(() => supabaseAdmin.from("scheduled_posts").select("user_id").eq("status", "published"))).map((p: any) => ctx.ownerOf.get(p.user_id) || p.user_id)
    );
    const everConnected = new Set(act.conns.filter((c) => c.is_active).map((c) => ctx.ownerOf.get(c.user_id) || c.user_id));
    const onboarded = accounts.filter((a) => ctx.profiles.get(a.id)?.business_name).length;

    // Publishing per day and per platform
    const postSeries = series.map((s) => ({ date: s.date, published: 0, failed: 0 }));
    const byPlatform = new Map<string, { platform: string; published: number; failed: number; connected: number; reconnect: number }>();
    const plat = (p: string) => {
      let v = byPlatform.get(p);
      if (!v) {
        v = { platform: p, published: 0, failed: 0, connected: 0, reconnect: 0 };
        byPlatform.set(p, v);
      }
      return v;
    };
    for (const p of act.posts) {
      const i = idx.get(dayKey(p.published_at || p.scheduled_for || p.created_at));
      if (p.status === "published") {
        plat(p.platform).published++;
        if (i !== undefined) postSeries[i].published++;
      } else if (p.status === "failed") {
        plat(p.platform).failed++;
        if (i !== undefined) postSeries[i].failed++;
      }
    }
    for (const c of act.conns.filter((c) => c.is_active)) {
      plat(c.platform).connected++;
      if (c.status === "needs_reconnect" || c.status === "expired") plat(c.platform).reconnect++;
    }
    const totals = [...act.per.values()].reduce(
      (s, v) => ({ published: s.published + v.published, failed: s.failed + v.failed, needs_action: s.needs_action + v.needs_action, scheduled: s.scheduled + v.scheduled, comments: s.comments + v.comments, replies: s.replies + v.replies, agent: s.agent + v.agent }),
      { published: 0, failed: 0, needs_action: 0, scheduled: 0, comments: 0, replies: 0, agent: 0 }
    );
    const upcoming = await count(() => supabaseAdmin.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("status", "scheduled").gte("scheduled_for", iso(now)));
    const briefings = await count(() => supabaseAdmin.from("ai_briefings").select("id", { count: "exact", head: true }).gte("generated_at", iso(now - days * DAY)));
    const mcpRows = await all(() => supabaseAdmin.from("mcp_usage").select("user_id, calls, day").gte("day", dayKey(now - days * DAY)));
    const mcpKeys = await count(() => supabaseAdmin.from("mcp_keys").select("id", { count: "exact", head: true }).is("revoked_at", null));
    const extraBrands = [...act.per.values()].reduce((s, v) => s + (v.brands - 1), 0);

    // What needs attention
    const email = new Map(accounts.map((a) => [a.id, a.email]));
    const attention: Array<{ kind: string; severity: "bad" | "warn"; user_id: string; email: string; detail: string }> = [];
    const failed24 = act.posts.filter((p) => p.status === "failed" && now - new Date(p.created_at).getTime() < 3 * DAY);
    const failedBy = new Map<string, any[]>();
    for (const p of failed24) {
      const o = ctx.ownerOf.get(p.user_id) || p.user_id;
      failedBy.set(o, [...(failedBy.get(o) || []), p]);
    }
    for (const [uid, list] of failedBy) attention.push({ kind: "failed_posts", severity: "bad", user_id: uid, email: email.get(uid) || uid, detail: `${list.length} failed post${list.length > 1 ? "s" : ""} in 3 days. Last: ${String(list[0].error_message || list[0].platform).slice(0, 120)}` });
    for (const c of act.conns.filter((c) => c.is_active && (c.status === "needs_reconnect" || c.status === "expired"))) {
      const o = ctx.ownerOf.get(c.user_id) || c.user_id;
      attention.push({ kind: "reconnect", severity: "warn", user_id: o, email: email.get(o) || o, detail: `${c.platform} needs to reconnect. ${String(c.last_error_message || "").slice(0, 100)}` });
    }
    for (const a of accounts) {
      if (planOf(a.id) !== "free" && !seen(a, 14)) attention.push({ kind: "inactive_paid", severity: "warn", user_id: a.id, email: a.email, detail: `Paid ${planOf(a.id)} account, no sign in for 14 days or more` });
    }

    res.json({
      success: true,
      data: {
        generated_at: iso(now),
        days,
        users: {
          total: accounts.length,
          new_in_range: newInRange,
          new_prev_range: prevNew,
          active_1d: accounts.filter((a) => seen(a, 1)).length,
          active_7d: accounts.filter((a) => seen(a, 7)).length,
          active_30d: accounts.filter((a) => seen(a, 30)).length,
          banned: accounts.filter(isBanned).length,
          paid,
          by_plan: byPlan,
          mrr,
          arpa: paid ? Math.round((mrr / paid) * 100) / 100 : 0,
          conversion_pct: accounts.length ? Math.round((paid / accounts.length) * 1000) / 10 : 0,
        },
        signups: series,
        funnel: [
          { key: "signed_up", label: "Signed up", count: accounts.length },
          { key: "onboarded", label: "Finished onboarding", count: onboarded },
          { key: "connected", label: "Connected an account", count: accounts.filter((a) => everConnected.has(a.id)).length },
          { key: "posted", label: "Published a post", count: accounts.filter((a) => everPosted.has(a.id)).length },
          { key: "paid", label: "On a paid plan", count: paid },
        ],
        publishing: { ...totals, upcoming, series: postSeries, success_pct: totals.published + totals.failed ? Math.round((totals.published / (totals.published + totals.failed)) * 1000) / 10 : null },
        platforms: [...byPlatform.values()].sort((a, b) => b.connected + b.published - (a.connected + a.published)),
        engagement: {
          comments: totals.comments,
          replies: totals.replies,
          agent_messages: totals.agent,
          agent_users: [...act.per.values()].filter((v) => v.agent > 0).length,
          briefings,
          mcp_calls: mcpRows.reduce((s: number, r: any) => s + (r.calls || 0), 0),
          mcp_users: new Set(mcpRows.map((r: any) => ctx.ownerOf.get(r.user_id) || r.user_id)).size,
          mcp_keys: mcpKeys,
        },
        workspaces: { extra_brands: extraBrands, multi_brand_accounts: [...act.per.values()].filter((v) => v.brands > 1).length },
        attention: attention.slice(0, 40),
      },
    });
  } catch (e: any) {
    console.error("[superadmin insights] overview", e);
    res.status(500).json({ error: e.message });
  }
});

insightsRouter.get("/insights/users", superadminAuthMiddleware, async (req, res) => {
  try {
    const ctx = await context();
    const { per } = await activity(ctx, 30);
    const now = Date.now();
    const q = String(req.query.search || "").toLowerCase().trim();
    const plan = String(req.query.plan || "all");
    const segment = String(req.query.segment || "all");
    const sort = String(req.query.sort || "created");
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 25));

    let rows = ctx.accounts.map((a) => {
      const v = per.get(a.id);
      const p = ctx.plans.get(a.id) || "free";
      const prof = ctx.profiles.get(a.id);
      const lastSeen = a.last_sign_in_at || null;
      const reasons: string[] = [];
      if (v?.failed) reasons.push(`${v.failed} failed post${v.failed > 1 ? "s" : ""}`);
      if (v?.reconnect) reasons.push(`${v.reconnect} account${v.reconnect > 1 ? "s" : ""} to reconnect`);
      if (p !== "free" && (!lastSeen || now - new Date(lastSeen).getTime() > 14 * DAY)) reasons.push("paid, inactive 14 days");
      return {
        id: a.id,
        email: a.email,
        name: prof?.business_name || a.user_metadata?.full_name || null,
        plan: p,
        created_at: a.created_at,
        last_seen: lastSeen,
        provider: a.app_metadata?.provider || "email",
        banned: !!isBanned(a),
        brands: v?.brands || 1,
        connections: v?.connections || 0,
        platforms: v ? [...v.platforms] : [],
        published_30d: v?.published || 0,
        failed_30d: v?.failed || 0,
        scheduled: v?.scheduled || 0,
        agent_30d: v?.agent || 0,
        comments_30d: v?.comments || 0,
        attention: reasons,
      };
    });

    if (q) rows = rows.filter((r) => `${r.email} ${r.name || ""} ${r.id}`.toLowerCase().includes(q));
    if (plan !== "all") rows = rows.filter((r) => r.plan === plan);
    const seenWithin = (r: any, d: number) => r.last_seen && now - new Date(r.last_seen).getTime() < d * DAY;
    if (segment === "active") rows = rows.filter((r) => seenWithin(r, 7));
    if (segment === "inactive") rows = rows.filter((r) => !seenWithin(r, 30));
    if (segment === "paid") rows = rows.filter((r) => r.plan !== "free");
    if (segment === "new") rows = rows.filter((r) => now - new Date(r.created_at).getTime() < 7 * DAY);
    if (segment === "attention") rows = rows.filter((r) => r.attention.length);
    if (segment === "no_connection") rows = rows.filter((r) => !r.connections);
    if (segment === "banned") rows = rows.filter((r) => r.banned);

    const t = (s: string | null) => (s ? new Date(s).getTime() : 0);
    const sorters: Record<string, (a: any, b: any) => number> = {
      created: (a, b) => t(b.created_at) - t(a.created_at),
      last_seen: (a, b) => t(b.last_seen) - t(a.last_seen),
      posts: (a, b) => b.published_30d - a.published_30d,
      connections: (a, b) => b.connections - a.connections,
      agent: (a, b) => b.agent_30d - a.agent_30d,
      plan: (a, b) => (PRICE[b.plan] || 0) - (PRICE[a.plan] || 0),
    };
    rows.sort(sorters[sort] || sorters.created);
    res.json({ success: true, data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit });
  } catch (e: any) {
    console.error("[superadmin insights] users", e);
    res.status(500).json({ error: e.message });
  }
});

insightsRouter.get("/insights/users/:id", superadminAuthMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const ctx = await context();
    const acc = ctx.accounts.find((a) => a.id === id);
    if (!acc) return res.status(404).json({ error: "Account not found" });
    const dataUsers = ctx.dataUsersOf.get(id) || [id];
    const [ws, conns, posts, logs, credits, notes, msgs, mcp] = await Promise.all([
      all(() => supabaseAdmin.from("workspaces").select("id, name, data_user_id, created_at").eq("owner_id", id)),
      all(() => supabaseAdmin.from("social_connections").select("user_id, platform, platform_username, status, is_active, last_error_message, last_synced_at, connected_at").in("user_id", dataUsers)),
      all(() => supabaseAdmin.from("scheduled_posts").select("id, user_id, platform, status, caption, scheduled_for, published_at, error_message, platform_permalink, created_at").in("user_id", dataUsers).order("created_at", { ascending: false }), 200),
      all(() => supabaseAdmin.from("activity_log").select("user_id, actor, action, object_type, created_at, detail").in("user_id", dataUsers).order("created_at", { ascending: false }), 50),
      supabaseAdmin.from("user_credits").select("*").eq("user_id", id).maybeSingle().then((r: any) => r.data, () => null),
      all(() => supabaseAdmin.from("user_notes").select("*").eq("user_id", id).order("created_at", { ascending: false }), 100),
      count(() => supabaseAdmin.from("agent_messages").select("id", { count: "exact", head: true }).in("user_id", dataUsers).eq("role", "user").gte("created_at", iso(Date.now() - 30 * DAY))),
      all(() => supabaseAdmin.from("mcp_usage").select("calls, day").in("user_id", dataUsers).gte("day", dayKey(Date.now() - 30 * DAY))),
    ]);
    const brands = (ws.length ? ws : [{ id: null, name: "Main", data_user_id: id, created_at: acc.created_at }]).map((w: any) => {
      const mineP = posts.filter((p) => p.user_id === w.data_user_id);
      return {
        id: w.id,
        name: w.name,
        is_main: w.data_user_id === id,
        connections: conns.filter((c) => c.user_id === w.data_user_id && c.is_active),
        published: mineP.filter((p) => p.status === "published").length,
        failed: mineP.filter((p) => p.status === "failed").length,
        scheduled: mineP.filter((p) => p.status === "scheduled").length,
      };
    });
    const brandName = new Map<string, string>(ws.map((w: any) => [w.data_user_id, w.name]));
    res.json({
      success: true,
      data: {
        account: {
          id,
          email: acc.email,
          created_at: acc.created_at,
          last_seen: acc.last_sign_in_at || null,
          provider: acc.app_metadata?.provider || "email",
          confirmed: !!acc.email_confirmed_at,
          banned: !!isBanned(acc),
          plan: ctx.plans.get(id) || "free",
        },
        profile: ctx.profiles.get(id) || null,
        credits,
        brands,
        recent_posts: posts.slice(0, 25).map((p) => ({ ...p, brand: brandName.get(p.user_id) || "Main" })),
        activity: logs.slice(0, 30).map((l) => ({ ...l, brand: brandName.get(l.user_id) || "Main" })),
        usage: { agent_messages_30d: msgs, mcp_calls_30d: mcp.reduce((s: number, r: any) => s + (r.calls || 0), 0), posts_total: posts.length },
        notes,
      },
    });
  } catch (e: any) {
    console.error("[superadmin insights] user", e);
    res.status(500).json({ error: e.message });
  }
});

/** Publishing: recent failures with the reason, posts stuck or overdue (a sign the cron is not running) */
insightsRouter.get("/insights/publishing", superadminAuthMiddleware, async (_req, res) => {
  try {
    const ctx = await context();
    const now = Date.now();
    const email = new Map(ctx.accounts.map((a) => [a.id, a.email]));
    const owner = (id: string) => ctx.ownerOf.get(id) || id;
    const [failed, stuck, overdue, needs] = await Promise.all([
      all(() => supabaseAdmin.from("scheduled_posts").select("id, user_id, platform, error_message, retry_count, scheduled_for, updated_at").eq("status", "failed").gte("updated_at", iso(now - 14 * DAY)).order("updated_at", { ascending: false }), 100),
      all(() => supabaseAdmin.from("scheduled_posts").select("id, user_id, platform, updated_at").eq("status", "publishing").lt("updated_at", iso(now - 15 * 60000)), 100),
      all(() => supabaseAdmin.from("scheduled_posts").select("id, user_id, platform, scheduled_for").eq("status", "scheduled").lt("scheduled_for", iso(now - 15 * 60000)), 100),
      all(() => supabaseAdmin.from("scheduled_posts").select("id, user_id, platform, error_message, updated_at").eq("status", "needs_action").gte("updated_at", iso(now - 14 * DAY)).order("updated_at", { ascending: false }), 100),
    ]);
    const shape = (p: any) => ({ ...p, account_id: owner(p.user_id), email: email.get(owner(p.user_id)) || null });
    // Group failure reasons so the most common problem is obvious
    const reasons = new Map<string, number>();
    for (const f of failed) {
      const r = String(f.error_message || "Unknown").replace(/\d{3,}/g, "#").slice(0, 90);
      reasons.set(`${f.platform}: ${r}`, (reasons.get(`${f.platform}: ${r}`) || 0) + 1);
    }
    res.json({
      success: true,
      data: {
        failed: failed.slice(0, 50).map(shape),
        needs_action: needs.slice(0, 50).map(shape),
        stuck: stuck.map(shape),
        overdue: overdue.map(shape),
        top_reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([reason, n]) => ({ reason, count: n })),
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** AI and API usage per day: agent messages, briefings, MCP calls, and AI cost when it is logged */
insightsRouter.get("/insights/usage", superadminAuthMiddleware, async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    const ctx = await context();
    const now = Date.now();
    const since = iso(now - days * DAY);
    const [msgs, briefs, mcp, cost, credits] = await Promise.all([
      all(() => supabaseAdmin.from("agent_messages").select("user_id, created_at").eq("role", "user").gte("created_at", since)),
      all(() => supabaseAdmin.from("ai_briefings").select("user_id, generated_at").gte("generated_at", since)),
      all(() => supabaseAdmin.from("mcp_usage").select("user_id, calls, day").gte("day", dayKey(now - days * DAY))),
      all(() => supabaseAdmin.from("api_usage_logs").select("user_id, service_name, model, cost_usd, created_at").gte("created_at", since)),
      all(() => supabaseAdmin.from("credit_transactions").select("user_id, operation_id, credits_delta, created_at").gte("created_at", since).lt("credits_delta", 0)),
    ]);
    const series: Array<{ date: string; agent: number; briefings: number; mcp: number; cost: number }> = [];
    for (let i = days - 1; i >= 0; i--) series.push({ date: dayKey(now - i * DAY), agent: 0, briefings: 0, mcp: 0, cost: 0 });
    const idx = new Map(series.map((s, i) => [s.date, i]));
    const bump = (d: string, k: "agent" | "briefings" | "mcp" | "cost", n = 1) => {
      const i = idx.get(dayKey(d));
      if (i !== undefined) series[i][k] += n;
    };
    msgs.forEach((m) => bump(m.created_at, "agent"));
    briefs.forEach((b) => bump(b.generated_at, "briefings"));
    mcp.forEach((m) => bump(m.day, "mcp", m.calls || 0));
    cost.forEach((c) => bump(c.created_at, "cost", Number(c.cost_usd || 0)));
    series.forEach((s) => (s.cost = Math.round(s.cost * 100) / 100));
    // Heaviest accounts by agent use
    const owner = (id: string) => ctx.ownerOf.get(id) || id;
    const byAcc = new Map<string, { agent: number; mcp: number; cost: number }>();
    const acc = (id: string) => byAcc.get(owner(id)) || (byAcc.set(owner(id), { agent: 0, mcp: 0, cost: 0 }), byAcc.get(owner(id))!);
    msgs.forEach((m) => acc(m.user_id).agent++);
    mcp.forEach((m) => (acc(m.user_id).mcp += m.calls || 0));
    cost.forEach((c) => c.user_id && (acc(c.user_id).cost += Number(c.cost_usd || 0)));
    const email = new Map(ctx.accounts.map((a) => [a.id, a.email]));
    const ops = new Map<string, number>();
    credits.forEach((c) => ops.set(c.operation_id || "other", (ops.get(c.operation_id || "other") || 0) - c.credits_delta));
    res.json({
      success: true,
      data: {
        days,
        series,
        totals: { agent: msgs.length, briefings: briefs.length, mcp: mcp.reduce((s, m) => s + (m.calls || 0), 0), cost: Math.round(cost.reduce((s, c) => s + Number(c.cost_usd || 0), 0) * 100) / 100, cost_logged: cost.length > 0 },
        top_accounts: [...byAcc.entries()].map(([id, v]) => ({ id, email: email.get(id) || id, ...v, cost: Math.round(v.cost * 100) / 100 })).sort((a, b) => b.agent + b.mcp - (a.agent + a.mcp)).slice(0, 10),
        credit_ops: [...ops.entries()].map(([op, n]) => ({ op, credits: n })).sort((a, b) => b.credits - a.credits).slice(0, 10),
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** Health from real signals: database round trip, overdue and stuck posts, briefings, and which keys are set */
insightsRouter.get("/insights/health", superadminAuthMiddleware, async (_req, res) => {
  try {
    const now = Date.now();
    const t0 = Date.now();
    const dbOk = await supabaseAdmin.from("user_plan").select("user_id", { count: "exact", head: true }).then((r: any) => !r.error, () => false);
    const dbMs = Date.now() - t0;
    const [overdue, stuck, lastPublished, lastBrief, reconnect] = await Promise.all([
      count(() => supabaseAdmin.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("status", "scheduled").lt("scheduled_for", iso(now - 15 * 60000))),
      count(() => supabaseAdmin.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("status", "publishing").lt("updated_at", iso(now - 15 * 60000))),
      supabaseAdmin.from("scheduled_posts").select("published_at").eq("status", "published").order("published_at", { ascending: false }).limit(1).maybeSingle().then((r: any) => r.data?.published_at || null, () => null),
      supabaseAdmin.from("ai_briefings").select("generated_at").order("generated_at", { ascending: false }).limit(1).maybeSingle().then((r: any) => r.data?.generated_at || null, () => null),
      count(() => supabaseAdmin.from("social_connections").select("id", { count: "exact", head: true }).eq("is_active", true).eq("status", "needs_reconnect")),
    ]);
    const env = (k: string) => !!process.env[k];
    const checks = [
      { name: "Database", status: dbOk ? (dbMs < 800 ? "good" : "warn") : "bad", detail: dbOk ? `Round trip ${dbMs} ms` : "The database did not answer" },
      { name: "Publishing queue", status: overdue + stuck === 0 ? "good" : overdue + stuck > 5 ? "bad" : "warn", detail: overdue + stuck === 0 ? "Nothing overdue or stuck" : `${overdue} overdue, ${stuck} stuck in publishing. Check the publish cron.` },
      { name: "Last published post", status: lastPublished ? "good" : "warn", detail: lastPublished ? new Date(lastPublished).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" }) + " WIB" : "No post published yet" },
      { name: "Morning briefings", status: lastBrief && now - new Date(lastBrief).getTime() < 2 * DAY ? "good" : "warn", detail: lastBrief ? `Last one ${new Date(lastBrief).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })} WIB` : "No briefing generated yet" },
      { name: "Connections to reconnect", status: reconnect === 0 ? "good" : "warn", detail: reconnect === 0 ? "All connected accounts are live" : `${reconnect} accounts need their owner to reconnect` },
    ];
    const keys = [
      ["AI (Sumopod)", "SUMOPOD_API_KEY"], ["AI (Anthropic)", "ANTHROPIC_API_KEY"], ["File storage (Vercel Blob)", "BLOB_READ_WRITE_TOKEN"], ["Token encryption", "ENCRYPTION_KEY"],
      ["Meta (Facebook, Instagram)", "FACEBOOK_APP_ID"], ["Threads", "THREADS_APP_ID"], ["TikTok", "TIKTOK_CLIENT_KEY"], ["LinkedIn", "LINKEDIN_CLIENT_ID"], ["YouTube (Google)", "GOOGLE_CLIENT_ID"],
      ["Pinterest", "PINTEREST_APP_ID"], ["Discord", "DISCORD_CLIENT_ID"], ["Telegram bot", "TELEGRAM_BOT_TOKEN"], ["Bluesky sign in key", "BLUESKY_OAUTH_PRIVATE_JWK"], ["Cron secret", "CRON_SECRET"], ["Email (Mailgun)", "MAILGUN_API_KEY"],
    ].map(([label, key]) => ({ label, key, set: env(key) }));
    res.json({ success: true, data: { checked_at: iso(now), checks, keys } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
