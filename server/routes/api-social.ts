/*
  Connect routes for Threads, Pinterest, YouTube, Mastodon (OAuth) and Bluesky, Telegram, Discord
  (credentials). Mounted at /api/auth before authRouter; anything else falls through to it.
    POST /api/auth/:platform/connect        OAuth: { url } to open. Mastodon needs { instance }.
    GET  /api/auth/:platform/callback       OAuth return, then back to /connections
    POST /api/auth/:platform/credentials    Bluesky { handle, app_password }, Telegram { chat, bot_token? }, Discord { webhook_url }
    POST /api/auth/:platform/disconnect     removes the connection and what ZieAds stored from it
    GET  /api/auth/pinterest/boards         boards for the Composer
  One click flows (no keys for the user to copy):
    POST /api/auth/bluesky/connect          { handle } -> Sign in with Bluesky URL (AT Protocol OAuth)
    GET  /api/auth/bluesky/callback
    POST /api/auth/telegram/start           code + t.me link to the ZieAds bot
    GET  /api/auth/telegram/status          polled by the connect window
    Discord uses the OAuth routes above (webhook.incoming)
  Telegram bot updates arrive at /api/telegram/webhook/:secret (telegramRouter).
*/
import { Router } from "express";
import crypto from "crypto";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { logActivity } from "../activity.js";
import { deletePlatformData } from "../dataDeletion.js";
import { OAUTH_PLATFORMS, OAuthPlatform, ENV_NEEDED, authUrl, exchange, normalizeInstance, mastodonApp, callbackUrl } from "../social/oauth.js";
import { CREDENTIAL_PLATFORMS, CredentialPlatform, verifyCredentials, CredentialError } from "../social/credentials.js";
import { saveConnection, loadConnection } from "../social/store.js";
import { blueskyAuthorizeUrl, blueskyCallback, blueskyRevoke } from "../social/bluesky-oauth.js";
import { startLink, linkStatus, handleUpdate, webhookSecret, botToken } from "../social/telegram-link.js";
import { publicOrigin } from "./api-oauth.js";

export const socialRouter = Router();
export const NEW_NETWORKS = [...OAUTH_PLATFORMS, ...CREDENTIAL_PLATFORMS] as string[];

const base = () => (process.env.OAUTH_REDIRECT_BASE_URL || "https://www.zieads.com").replace(/\/$/, "");

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const isOAuth = (p: string): p is OAuthPlatform => (OAUTH_PLATFORMS as string[]).includes(p);

/* ── Sign in with Bluesky ── */
socialRouter.post("/bluesky/connect", requireAuth, async (req: any, res) => {
  const handle = String(req.body?.handle || "").trim().replace(/^@/, "");
  if (!handle || /\s/.test(handle)) return res.status(400).json({ error: "Enter your Bluesky handle, for example you.bsky.social." });
  const state = crypto.randomBytes(16).toString("hex");
  const { error } = await supabaseAdmin.from("oauth_states").insert({ state, user_id: req.userId, platform: "bluesky", metadata: { handle } });
  if (error) return res.status(500).json({ error: "Could not start the connection. Run the networks migration in Supabase." });
  try {
    res.json({ url: await blueskyAuthorizeUrl(handle, state) });
  } catch (e: any) {
    res.status(400).json({ error: `Could not find ${handle} on Bluesky. Check the handle. (${String(e.message).slice(0, 120)})` });
  }
});

socialRouter.get("/bluesky/callback", async (req: any, res) => {
  const back = (q: string) => res.redirect(`${base()}/connections?${q}`);
  if (req.query.error) return back("error=bluesky_denied");
  try {
    const params = new URLSearchParams(req.query as Record<string, string>);
    const r = await blueskyCallback(params);
    const { data: st } = r.state ? await supabaseAdmin.from("oauth_states").select("*").eq("state", r.state).eq("platform", "bluesky").maybeSingle() : { data: null };
    if (!st) return back("error=bluesky_csrf");
    await supabaseAdmin.from("oauth_states").delete().eq("state", r.state);
    await saveConnection(st.user_id, "bluesky", {
      platformUserId: r.did,
      username: r.handle,
      displayName: r.displayName || r.handle,
      avatarUrl: r.avatar,
      accessToken: "oauth",
      scopes: "atproto transition:generic",
      metadata: { auth: "oauth", did: r.did, handle: r.handle },
    });
    return back("connected=bluesky");
  } catch (e: any) {
    console.error("[social] bluesky callback failed:", e.message);
    return back(`error=bluesky_exchange_failed&detail=${encodeURIComponent(String(e.message).slice(0, 160))}`);
  }
});

/* ── Telegram through the ZieAds bot ── */
socialRouter.post("/telegram/start", requireAuth, async (req: any, res) => {
  try {
    res.json({ success: true, ...(await startLink(req.userId, publicOrigin(req))) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

socialRouter.get("/telegram/status", requireAuth, async (req: any, res) => {
  res.json({ success: true, ...(await linkStatus(req.userId, String(req.query.code || ""))) });
});
const isCred = (p: string): p is CredentialPlatform => (CREDENTIAL_PLATFORMS as string[]).includes(p);

socialRouter.post("/:platform/connect", async (req: any, res, next) => {
  const p = req.params.platform;
  if (!isOAuth(p)) return isCred(p) ? res.status(400).json({ error: "This network connects with a form, not a sign in screen." }) : next();
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const missing = ENV_NEEDED[p].filter((k) => !process.env[k]);
  if (missing.length) return res.status(500).json({ error: `${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} missing on the server.` });
  const state = crypto.randomBytes(16).toString("hex");
  const meta: Record<string, string> = {};
  let clientId: string | undefined;
  if (p === "mastodon") {
    const instance = normalizeInstance(req.body?.instance);
    if (!instance) return res.status(400).json({ error: "Enter your Mastodon server, for example mastodon.social." });
    try {
      clientId = (await mastodonApp(instance, callbackUrl(base(), "mastodon"))).client_id;
    } catch (e: any) {
      return res.status(400).json({ error: `Could not reach ${instance}. Check the server name. (${e.message})` });
    }
    meta.instance = instance;
  }
  const { error } = await supabaseAdmin.from("oauth_states").insert({ state, user_id: userId, platform: p, metadata: meta });
  if (error) return res.status(500).json({ error: "Could not start the connection. Run the networks migration in Supabase." });
  res.json({ url: authUrl(p, state, base(), { instance: meta.instance, clientId }) });
});

socialRouter.get("/:platform/callback", async (req: any, res, next) => {
  const p = req.params.platform;
  if (!isOAuth(p)) return next();
  const back = (q: string) => res.redirect(`${base()}/connections?${q}`);
  const { code, state, error } = req.query as Record<string, string>;
  if (error) return back(`error=${p}_denied`);
  if (!code || !state) return back(`error=${p}_invalid_callback`);
  const { data: st } = await supabaseAdmin.from("oauth_states").select("*").eq("state", state).eq("platform", p).maybeSingle();
  if (!st) return back(`error=${p}_csrf`);
  await supabaseAdmin.from("oauth_states").delete().eq("state", state);
  try {
    const saved = await exchange(p, code, base(), st.metadata || {});
    await saveConnection(st.user_id, p, saved);
    return back(`connected=${p}`);
  } catch (e: any) {
    console.error(`[social] ${p} callback failed:`, e.message);
    return back(`error=${p}_exchange_failed&detail=${encodeURIComponent(String(e.message).slice(0, 160))}`);
  }
});

socialRouter.post("/:platform/credentials", requireAuth, async (req: any, res, next) => {
  const p = req.params.platform;
  if (!isCred(p)) return next();
  try {
    const saved = await verifyCredentials(p, req.body || {});
    await saveConnection(req.userId, p, saved);
    res.json({ success: true, platform: p, username: saved.username, display_name: saved.displayName });
  } catch (e: any) {
    if (e instanceof CredentialError) return res.status(400).json({ error: e.message });
    console.error(`[social] ${p} credentials failed:`, e.message);
    res.status(502).json({ error: `Could not reach ${p}. Try again in a minute.` });
  }
});

socialRouter.post("/:platform/disconnect", requireAuth, async (req: any, res, next) => {
  const p = req.params.platform;
  if (!NEW_NETWORKS.includes(p)) return next();
  if (p === "bluesky") {
    const c = await loadConnection(req.userId, "bluesky");
    if (c?.metadata?.auth === "oauth") await blueskyRevoke(c.metadata.did || c.platformUserId);
  }
  const deleted = await deletePlatformData(req.userId, p);
  await logActivity(req.userId, "user", "connection.disconnected", "platform", p, { deleted });
  res.json({ success: true, platform: p, deleted });
});

socialRouter.get("/pinterest/boards", requireAuth, async (req: any, res) => {
  const c = await loadConnection(req.userId, "pinterest");
  if (!c) return res.json({ success: true, boards: [] });
  res.json({ success: true, boards: c.metadata.boards || [], default_board_id: c.metadata.default_board_id || null });
});

/* Telegram calls this for every update the ZieAds bot receives */
export const telegramRouter = Router();
telegramRouter.post("/webhook/:secret", async (req: any, res) => {
  const token = botToken();
  const secret = webhookSecret(token);
  if (!token || req.params.secret !== secret || req.headers["x-telegram-bot-api-secret-token"] !== secret) return res.status(401).end();
  try {
    await handleUpdate(req.body || {});
  } catch (e: any) {
    console.error("[telegram] update failed:", e.message);
  }
  // Always 200 so Telegram does not retry the same update forever
  res.json({ ok: true });
});
