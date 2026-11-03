/*
  OAuth 2.1 for the ZieAds MCP server, so Claude (claude.ai, Desktop, mobile), ChatGPT
  and other connectors can connect with a "Sign in with ZieAds" screen instead of a pasted key.
  Follows the MCP authorization spec (2025-06-18):
    GET  /.well-known/oauth-protected-resource[/mcp|/api/mcp]   resource metadata (RFC 9728)
    GET  /.well-known/oauth-authorization-server[/...]     server metadata (RFC 8414)
    GET  /.well-known/openid-configuration                 same document, for clients that look there
    POST /api/oauth/register                               dynamic client registration (RFC 7591)
    GET  /api/oauth/client                                 client name for the consent screen
    POST /api/oauth/authorize                              the signed in user allows or denies (from /oauth/authorize)
    POST /api/oauth/token                                  authorization_code with PKCE S256, refresh_token (rotating)
    POST /api/oauth/revoke                                 revoke an access or refresh token (RFC 7009)
  Access tokens are rows in mcp_keys (kind 'oauth'), so they show up and can be revoked in Settings.
*/
import crypto from "crypto";
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { logActivity } from "../activity.js";
import { hashKey, newKey } from "../mcp/server.js";

export const oauthRouter = Router();

export const ACCESS_TTL_S = 3600;
const REFRESH_TTL_MS = 90 * 86400000;
const CODE_TTL_MS = 10 * 60000;
const SCOPES = ["read", "draft"];

/** Origin of the request as the client sees it (www.zieads.com in production) */
export function publicOrigin(req: any): string {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (!host) return (process.env.PUBLIC_APP_URL || "https://www.zieads.com").replace(/\/$/, "");
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = String(req.headers["x-forwarded-proto"] || (local ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${host}`;
}

/** The MCP server answers at /mcp (the public address) and at /api/mcp (kept for old configs) */
export const mcpPathOf = (req: any) => (String(req.originalUrl || req.url || "").includes("/api/mcp") ? "/api/mcp" : "/mcp");
export const resourceMetadataUrl = (req: any) => `${publicOrigin(req)}/.well-known/oauth-protected-resource${mcpPathOf(req)}`;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest();
const b64url = (b: Buffer) => b.toString("base64url");
const rand = (n = 32) => crypto.randomBytes(n).toString("base64url");

function cleanScopes(v: any): string[] {
  const asked = String(v || "read draft").split(/[\s,]+/).filter((s) => SCOPES.includes(s));
  const set = new Set(["read", ...asked]);
  return SCOPES.filter((s) => set.has(s));
}

/** https anywhere, http only on loopback (native apps and local tools) */
function validRedirect(u: string): boolean {
  try {
    const url = new URL(u);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    // Custom schemes for desktop apps such as cursor:// or vscode://
    return /^[a-z][a-z0-9+.-]*:$/.test(url.protocol) && !["javascript:", "data:", "file:", "vbscript:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function resourceDoc(req: any) {
  const o = publicOrigin(req);
  return {
    resource: `${o}${mcpPathOf(req)}`,
    authorization_servers: [o],
    scopes_supported: SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "ZieAds",
    resource_documentation: `${o}/docs/mcp`,
  };
}

function serverDoc(req: any) {
  const o = publicOrigin(req);
  return {
    issuer: o,
    authorization_endpoint: `${o}/oauth/authorize`,
    token_endpoint: `${o}/api/oauth/token`,
    registration_endpoint: `${o}/api/oauth/register`,
    revocation_endpoint: `${o}/api/oauth/revoke`,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    revocation_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    scopes_supported: SCOPES,
    service_documentation: `${o}/docs/mcp/oauth`,
  };
}

const json = (res: any, status: number, body: any) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(body);
};
const oauthError = (res: any, status: number, error: string, description: string) => json(res, status, { error, error_description: description });

oauthRouter.get(["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp", "/.well-known/oauth-protected-resource/api/mcp"], (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(resourceDoc(req));
});
oauthRouter.get(
  ["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/mcp", "/.well-known/oauth-authorization-server/api/mcp", "/.well-known/openid-configuration", "/.well-known/openid-configuration/mcp", "/.well-known/openid-configuration/api/mcp"],
  (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(serverDoc(req));
  }
);

// ─── Dynamic client registration ───
oauthRouter.post("/api/oauth/register", async (req, res) => {
  const b = req.body || {};
  const uris: string[] = Array.isArray(b.redirect_uris) ? b.redirect_uris.map(String).slice(0, 10) : [];
  if (!uris.length || !uris.every(validRedirect)) return oauthError(res, 400, "invalid_redirect_uri", "redirect_uris must be https URLs (http only for localhost)");
  const method = ["none", "client_secret_post", "client_secret_basic"].includes(b.token_endpoint_auth_method) ? b.token_endpoint_auth_method : "none";
  const clientId = `zc_${rand(18)}`;
  const secret = method === "none" ? null : `zcs_${rand(32)}`;
  const name = String(b.client_name || "MCP client").replace(/[<>]/g, "").trim().slice(0, 80) || "MCP client";
  const { error } = await supabaseAdmin.from("oauth_clients").insert({ client_id: clientId, client_secret_hash: secret ? hashKey(secret) : null, client_name: name, redirect_uris: uris });
  if (error) return oauthError(res, 500, "server_error", "Could not register the client. Run the API and MCP migration in Supabase.");
  json(res, 201, {
    client_id: clientId,
    ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name,
    redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: method,
    scope: SCOPES.join(" "),
  });
});

async function getClient(id: any) {
  if (typeof id !== "string" || !id) return null;
  const { data } = await supabaseAdmin.from("oauth_clients").select("client_id, client_secret_hash, client_name, redirect_uris").eq("client_id", id).maybeSingle();
  return data as { client_id: string; client_secret_hash: string | null; client_name: string; redirect_uris: string[] } | null;
}

/** What the consent screen shows. Never redirects, so it is safe to call with any input. */
oauthRouter.get("/api/oauth/client", async (req, res) => {
  const c = await getClient(req.query.client_id);
  if (!c) return json(res, 404, { error: "Unknown app. Start the connection again from your AI assistant." });
  const redirect = String(req.query.redirect_uri || "");
  const ok = c.redirect_uris.includes(redirect);
  let host = "";
  try {
    host = new URL(redirect).host;
  } catch {
    host = "";
  }
  json(res, 200, { client_name: c.client_name, redirect_ok: ok, redirect_host: host, scopes: SCOPES });
});

// ─── The signed in user decides (called by the /oauth/authorize page) ───
oauthRouter.post("/api/oauth/authorize", async (req: any, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return json(res, 401, { error: "Log in to ZieAds first" });
  const b = req.body || {};
  const c = await getClient(b.client_id);
  if (!c) return json(res, 400, { error: "Unknown app. Start the connection again from your AI assistant." });
  const redirect = String(b.redirect_uri || "");
  // Never send the user to a URL the app did not register
  if (!c.redirect_uris.includes(redirect)) return json(res, 400, { error: "This app's return address does not match its registration." });
  const back = new URL(redirect);
  if (b.state) back.searchParams.set("state", String(b.state));
  back.searchParams.set("iss", publicOrigin(req));
  if (b.decision !== "allow") {
    back.searchParams.set("error", "access_denied");
    back.searchParams.set("error_description", "The user denied access");
    return json(res, 200, { redirect: back.toString() });
  }
  if (b.response_type && b.response_type !== "code") {
    back.searchParams.set("error", "unsupported_response_type");
    return json(res, 200, { redirect: back.toString() });
  }
  if (b.code_challenge_method !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(String(b.code_challenge || ""))) {
    back.searchParams.set("error", "invalid_request");
    back.searchParams.set("error_description", "PKCE with S256 is required");
    return json(res, 200, { redirect: back.toString() });
  }
  const code = `zac_${rand(32)}`;
  const scopes = cleanScopes(b.scopes || b.scope);
  const { error } = await supabaseAdmin.from("oauth_codes").insert({
    code_hash: hashKey(code),
    client_id: c.client_id,
    user_id: userId,
    redirect_uri: redirect,
    code_challenge: String(b.code_challenge),
    scopes,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) return json(res, 500, { error: "Could not finish. Try again." });
  await logActivity(userId, "user", "mcp.oauth_allowed", "oauth_client", c.client_id, { app: c.client_name, scopes });
  back.searchParams.set("code", code);
  json(res, 200, { redirect: back.toString() });
});

/** client_secret_basic or client_secret_post; public clients send only client_id */
function clientCredentials(req: any): { id?: string; secret?: string } {
  const h = String(req.headers.authorization || "");
  if (/^Basic\s+/i.test(h)) {
    const [id, secret] = Buffer.from(h.replace(/^Basic\s+/i, ""), "base64").toString().split(":");
    return { id: decodeURIComponent(id || ""), secret: decodeURIComponent(secret || "") };
  }
  return { id: req.body?.client_id, secret: req.body?.client_secret };
}

async function authClient(req: any) {
  const cred = clientCredentials(req);
  const c = await getClient(cred.id);
  if (!c) return null;
  if (c.client_secret_hash && (!cred.secret || hashKey(cred.secret) !== c.client_secret_hash)) return null;
  return c;
}

function issue() {
  const access = newKey();
  const refresh = `zr_${rand(32)}`;
  return { access, refresh, refreshHash: hashKey(refresh) };
}

oauthRouter.post("/api/oauth/token", async (req: any, res) => {
  const b = req.body || {};
  const c = await authClient(req);
  if (!c) return oauthError(res, 401, "invalid_client", "Unknown client or wrong client secret");

  if (b.grant_type === "authorization_code") {
    const code = String(b.code || "");
    const { data: row } = await supabaseAdmin.from("oauth_codes").select("*").eq("code_hash", hashKey(code)).maybeSingle();
    if (!row || row.client_id !== c.client_id) return oauthError(res, 400, "invalid_grant", "Unknown authorization code");
    if (row.used_at) return oauthError(res, 400, "invalid_grant", "This code was already used");
    if (new Date(row.expires_at).getTime() < Date.now()) return oauthError(res, 400, "invalid_grant", "This code expired. Connect again.");
    if (b.redirect_uri && b.redirect_uri !== row.redirect_uri) return oauthError(res, 400, "invalid_grant", "redirect_uri does not match");
    const verifier = String(b.code_verifier || "");
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || b64url(sha(verifier)) !== row.code_challenge) return oauthError(res, 400, "invalid_grant", "PKCE check failed");
    // One use only, claimed atomically so a replay loses the race
    const { data: claimed } = await supabaseAdmin.from("oauth_codes").update({ used_at: new Date().toISOString() }).eq("code_hash", row.code_hash).is("used_at", null).select("code_hash").maybeSingle();
    if (!claimed) return oauthError(res, 400, "invalid_grant", "This code was already used");

    // Reconnecting the same app replaces its old token, so Settings shows one row per app
    await supabaseAdmin.from("mcp_keys").update({ revoked_at: new Date().toISOString() }).eq("user_id", row.user_id).eq("oauth_client_id", c.client_id).is("revoked_at", null);
    const t = issue();
    const { error } = await supabaseAdmin.from("mcp_keys").insert({
      user_id: row.user_id,
      name: c.client_name,
      kind: "oauth",
      oauth_client_id: c.client_id,
      key_hash: t.access.hash,
      key_preview: t.access.preview,
      scopes: row.scopes,
      auto_approve: [],
      expires_at: new Date(Date.now() + ACCESS_TTL_S * 1000).toISOString(),
      refresh_hash: t.refreshHash,
      refresh_expires_at: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
    });
    if (error) return oauthError(res, 500, "server_error", "Could not create the token");
    await logActivity(row.user_id, "mcp", "mcp.oauth_connected", "oauth_client", c.client_id, { app: c.client_name });
    return json(res, 200, { access_token: t.access.raw, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: t.refresh, scope: row.scopes.join(" ") });
  }

  if (b.grant_type === "refresh_token") {
    const { data: k } = await supabaseAdmin.from("mcp_keys").select("id, user_id, scopes, oauth_client_id, revoked_at, refresh_expires_at").eq("refresh_hash", hashKey(String(b.refresh_token || ""))).maybeSingle();
    if (!k || k.revoked_at || k.oauth_client_id !== c.client_id) return oauthError(res, 400, "invalid_grant", "Unknown or revoked refresh token");
    if (k.refresh_expires_at && new Date(k.refresh_expires_at).getTime() < Date.now()) return oauthError(res, 400, "invalid_grant", "The refresh token expired. Connect again.");
    // Scope can only shrink on refresh
    const scopes = b.scope ? cleanScopes(b.scope).filter((s) => k.scopes.includes(s)) : k.scopes;
    const t = issue();
    const { data: rotated } = await supabaseAdmin
      .from("mcp_keys")
      .update({
        key_hash: t.access.hash,
        key_preview: t.access.preview,
        scopes,
        expires_at: new Date(Date.now() + ACCESS_TTL_S * 1000).toISOString(),
        refresh_hash: t.refreshHash,
        refresh_expires_at: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
      })
      .eq("id", k.id)
      .eq("refresh_hash", hashKey(String(b.refresh_token)))
      .select("id")
      .maybeSingle();
    if (!rotated) return oauthError(res, 400, "invalid_grant", "This refresh token was already used");
    return json(res, 200, { access_token: t.access.raw, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: t.refresh, scope: scopes.join(" ") });
  }

  return oauthError(res, 400, "unsupported_grant_type", "Use authorization_code or refresh_token");
});

oauthRouter.post("/api/oauth/revoke", async (req: any, res) => {
  const token = String(req.body?.token || "");
  if (token) {
    const h = hashKey(token);
    const col = token.startsWith("zr_") ? "refresh_hash" : "key_hash";
    await supabaseAdmin.from("mcp_keys").update({ revoked_at: new Date().toISOString() }).eq(col, h).eq("kind", "oauth").is("revoked_at", null);
  }
  res.status(200).end();
});
