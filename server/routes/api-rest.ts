/*
  ZieAds REST API v1. Base URL https://www.zieads.com/api (mounted at /api; /v1 stays as an alias).
  Only these paths are handled here, so the dashboard's own /api routes are untouched.
  Same keys, scopes, approvals and daily limit as the MCP server: every endpoint runs the matching MCP tool,
  so the two can never drift apart. Docs: /docs/api.
    GET  /api/me                        key, plan and today's usage
    GET  /api/accounts                  connected social accounts
    GET  /api/briefing                  latest daily briefing
    GET  /api/analytics                 ?days=7|30|90|365&platform=
    GET  /api/ads/summary               ?days=1-365
    GET  /api/posts                     ?from=&to=&status=
    POST /api/posts                     draft a post (draft scope)
    GET  /api/comments                  ?view=needs_reply|buying|complaints|questions|all&limit=
    POST /api/comments/:id/reply        draft a reply (draft scope)
    GET  /api/competitors
    POST /api/competitors               ask to track a competitor (draft scope)
    GET  /api/guardian                  connection health and failed posts
    GET  /api/actions                   actions waiting for approval
  Responses: { "data": ... }. Errors: { "error": { "code": "...", "message": "..." } }.
*/
import { Router } from "express";
import { getEffectivePlan, supabaseAdmin } from "../supabaseServer.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { authenticate, countCall, McpKey, McpToolError, runTool, ScopeError } from "../mcp/server.js";

export const restRouter = Router();

const fail = (res: any, status: number, code: string, message: string, details?: unknown) =>
  res.status(status).json({ error: { code, message, ...(details !== undefined ? { details } : {}) } });

/** Key check for every REST endpoint: a Settings key or an OAuth token, plus the daily limit */
async function auth(req: any, res: any, next: any) {
  const key = await authenticate(req.headers.authorization);
  if (!key) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="zieads", error="invalid_token"');
    return fail(res, 401, "unauthorized", "Missing, expired or revoked API key. Create one in Settings, API and MCP, then send it as Authorization: Bearer zk_...");
  }
  const c = await countCall(key.user_id);
  if (c.limit !== -1) {
    res.setHeader("X-RateLimit-Limit", String(c.limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, c.limit - c.used)));
  }
  if (!c.ok) return fail(res, 429, "rate_limited", `Daily limit reached (${c.limit} calls on your plan). It resets at 00:00 UTC.`);
  req.apiKey = key;
  supabaseAdmin.from("mcp_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id).then(() => undefined, () => undefined);
  next();
}

/** Runs one MCP tool and maps its errors to HTTP */
const run = (name: string, args: (req: any) => Record<string, any> = () => ({}), status = 200) => async (req: any, res: any) => {
  try {
    const data = await runTool(req.apiKey as McpKey, name, args(req));
    res.status(status).json({ data });
  } catch (e: any) {
    if (e instanceof ScopeError) return fail(res, 403, "insufficient_scope", e.message);
    if (e instanceof McpToolError) return fail(res, 400, "invalid_request", e.message, e.data);
    console.error(`[rest] ${name} failed:`, e);
    fail(res, 500, "server_error", "ZieAds could not finish this request. Try again shortly.");
  }
};

const num = (v: any) => (v === undefined || v === "" ? undefined : Number(v));

restRouter.get("/me", auth, async (req: any, res) => {
  const k = req.apiKey as McpKey;
  const plan = await getEffectivePlan(k.user_id);
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from("mcp_usage").select("calls").eq("user_id", k.user_id).eq("day", day).maybeSingle();
  res.json({ data: { key: { id: k.id, name: k.name, kind: k.kind || "key", scopes: k.scopes, auto_approve: k.auto_approve }, plan, usage: { day, used: data?.calls || 0, limit: PLAN_LIMITS[plan].mcpDailyCalls } } });
});
restRouter.get("/accounts", auth, run("list_accounts"));
restRouter.get("/briefing", auth, run("get_briefing"));
restRouter.get("/analytics", auth, run("get_analytics", (r) => ({ days: num(r.query.days), platform: r.query.platform || undefined })));
restRouter.get("/ads/summary", auth, run("get_ads_summary", (r) => ({ days: num(r.query.days) })));
restRouter.get("/posts", auth, run("list_posts", (r) => ({ from: r.query.from, to: r.query.to, status: r.query.status })));
restRouter.post("/posts", auth, run("create_draft_post", (r) => r.body || {}, 201));
restRouter.get("/comments", auth, run("list_comments", (r) => ({ view: r.query.view, limit: num(r.query.limit) })));
restRouter.post("/comments/:id/reply", auth, run("draft_comment_reply", (r) => ({ comment_id: r.params.id, text: r.body?.text }), 201));
restRouter.get("/competitors", auth, run("list_competitors"));
restRouter.post("/competitors", auth, run("add_competitor", (r) => r.body || {}, 201));
restRouter.get("/guardian", auth, run("get_guardian_status"));
restRouter.get("/actions", auth, run("list_pending_actions"));

/** For the /v1 alias only: anything else under /v1 is a clear 404 */
export const restNotFound = (req: any, res: any) => fail(res, 404, "not_found", `No endpoint ${req.method} ${req.baseUrl}${req.path}. See https://www.zieads.com/docs/api`);
