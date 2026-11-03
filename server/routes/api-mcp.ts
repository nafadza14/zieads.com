/*
  MCP endpoint and key management (spec 10). Mounted at /api.
  POST /mcp                       Streamable HTTP, JSON responses (stateless)
  GET  /mcp                       405: this server does not open SSE streams
  GET  /mcp/keys                  list keys (never the secret)
  POST /mcp/keys                  { name, scopes, auto_approve } -> secret shown once
  POST /mcp/keys/:id              update name, scopes, auto_approve
  POST /mcp/keys/:id/revoke       revoke
  GET  /mcp/usage                 calls today and the plan limit
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { logActivity } from "../activity.js";
import { authenticate, countCall, handleMessage, newKey, AUTO_APPROVABLE } from "../mcp/server.js";
import { resourceMetadataUrl } from "./api-oauth.js";

export const mcpRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const SCOPES = ["read", "draft"];
/** A missing table means the API and MCP migration was not run on this Supabase project */
const setupHint = (m: string) => (/mcp_keys|kind|does not exist|schema cache/i.test(m) ? "API and MCP is not set up on the database yet. Run supabase/migrations/20261104_api_mcp_oauth.sql in the Supabase SQL editor." : m);
const cleanScopes = (v: any) => {
  const s = (Array.isArray(v) ? v : ["read", "draft"]).filter((x: any) => SCOPES.includes(x));
  return s.includes("read") ? [...new Set(s)] : ["read", ...new Set(s)];
};
const cleanAuto = (v: any) => (Array.isArray(v) ? [...new Set(v.filter((x: any) => (AUTO_APPROVABLE as readonly string[]).includes(x)))] : []);

mcpRouter.post("/mcp", async (req: any, res) => {
  const key = await authenticate(req.headers.authorization);
  if (!key) {
    // resource_metadata tells OAuth clients (Claude, ChatGPT) where to start "Sign in with ZieAds"
    res.setHeader("WWW-Authenticate", `Bearer realm="zieads", resource_metadata="${resourceMetadataUrl(req)}"${req.headers.authorization ? ', error="invalid_token"' : ""}`);
    return res.status(401).json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Missing, expired or revoked ZieAds key. Connect with OAuth or create a key in Settings, API and MCP." } });
  }
  const body = req.body;
  const batch = Array.isArray(body) ? body : [body];
  if (!batch.length || batch.length > 20) return res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Send 1 to 20 messages" } });

  const out: any[] = [];
  for (const msg of batch) {
    if (msg?.method === "tools/call") {
      const c = await countCall(key.user_id);
      if (!c.ok) {
        out.push({ jsonrpc: "2.0", id: msg.id ?? null, error: { code: -32029, message: `Daily MCP limit reached (${c.limit} calls). It resets at 00:00 UTC.` } });
        continue;
      }
    }
    const r = await handleMessage(key, msg);
    if (r) out.push(r);
  }
  await supabaseAdmin.from("mcp_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  // Only notifications or responses: 202 with no body, per the transport spec
  if (!out.length) return res.status(202).end();
  res.status(200).json(Array.isArray(body) ? out : out[0]);
});

mcpRouter.get("/mcp", (_req, res) => {
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "This MCP server answers POST requests with JSON. Point your MCP client at this URL." });
});
mcpRouter.delete("/mcp", (_req, res) => {
  res.setHeader("Allow", "POST");
  res.status(405).end();
});

mcpRouter.get("/mcp/keys", requireAuth, async (req: any, res) => {
  const { data, error } = await supabaseAdmin.from("mcp_keys").select("id, name, key_preview, scopes, auto_approve, last_used_at, revoked_at, created_at, kind").eq("user_id", req.userId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: setupHint(error.message) });
  res.json({ success: true, keys: data || [], auto_approvable: AUTO_APPROVABLE });
});

mcpRouter.post("/mcp/keys", requireAuth, async (req: any, res) => {
  const { count } = await supabaseAdmin.from("mcp_keys").select("id", { count: "exact", head: true }).eq("user_id", req.userId).eq("kind", "key").is("revoked_at", null);
  if ((count || 0) >= 10) return res.status(400).json({ error: "You can have 10 active keys. Revoke one first." });
  const k = newKey();
  const row = {
    user_id: req.userId,
    name: String(req.body?.name || "MCP key").trim().slice(0, 60) || "MCP key",
    key_hash: k.hash,
    key_preview: k.preview,
    scopes: cleanScopes(req.body?.scopes),
    auto_approve: cleanAuto(req.body?.auto_approve),
    kind: "key",
  };
  const { data, error } = await supabaseAdmin.from("mcp_keys").insert(row).select("id, name, key_preview, scopes, auto_approve, created_at, kind").single();
  if (error) return res.status(500).json({ error: setupHint(error.message) });
  await logActivity(req.userId, "user", "mcp.key_created", "mcp_key", data.id, { name: row.name, scopes: row.scopes, auto_approve: row.auto_approve });
  res.json({ success: true, key: data, secret: k.raw });
});

mcpRouter.post("/mcp/keys/:id", requireAuth, async (req: any, res) => {
  const patch: any = {};
  if (req.body?.name !== undefined) patch.name = String(req.body.name).trim().slice(0, 60) || "MCP key";
  if (req.body?.scopes !== undefined) patch.scopes = cleanScopes(req.body.scopes);
  if (req.body?.auto_approve !== undefined) patch.auto_approve = cleanAuto(req.body.auto_approve);
  const { data, error } = await supabaseAdmin.from("mcp_keys").update(patch).eq("id", req.params.id).eq("user_id", req.userId).is("revoked_at", null).select("id, name, key_preview, scopes, auto_approve").maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Key not found" });
  await logActivity(req.userId, "user", "mcp.key_updated", "mcp_key", data.id, patch);
  res.json({ success: true, key: data });
});

mcpRouter.post("/mcp/keys/:id/revoke", requireAuth, async (req: any, res) => {
  const { data } = await supabaseAdmin.from("mcp_keys").update({ revoked_at: new Date().toISOString() }).eq("id", req.params.id).eq("user_id", req.userId).is("revoked_at", null).select("id, name").maybeSingle();
  if (!data) return res.status(404).json({ error: "Key not found" });
  await logActivity(req.userId, "user", "mcp.key_revoked", "mcp_key", data.id, { name: data.name });
  res.json({ success: true });
});

mcpRouter.get("/mcp/usage", requireAuth, async (req: any, res) => {
  const plan = await getEffectivePlan(req.userId);
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from("mcp_usage").select("calls").eq("user_id", req.userId).eq("day", day).maybeSingle();
  res.json({ success: true, plan, used: data?.calls || 0, limit: PLAN_LIMITS[plan].mcpDailyCalls });
});
