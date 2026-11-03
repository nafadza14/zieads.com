/*
  Scheduler endpoints and platform webhooks. Mounted at /api/v3 before the older router.

  Cron (GET or POST, header Authorization: Bearer CRON_SECRET, which Vercel Cron sends):
    /cron/publish-scheduled   publish due posts (point an every-minute scheduler here)
    /publish/cron             same, kept for the existing vercel.json entry
    /jobs/run                 heartbeat: publish, Facebook sync, Guardian, briefings
    /cron/sync-facebook       Facebook polling fallback
    /cron/scheduled-agents    run due scheduled agents (every 15 minutes is enough)

  Webhooks:
    GET/POST /webhooks/facebook   Page feed events (comments) for the Inbox
*/
import { Router } from "express";
import crypto from "crypto";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { runDuePosts } from "../publish/publisher.js";
import { syncAllFacebook, syncFacebookForUser, ingestFacebookComment } from "../facebook/sync.js";
import { runHeartbeat } from "../jobs/heartbeat.js";
import { runDueScheduledAgents } from "../agents/scheduled.js";

export const jobsRouter = Router();

/** Accepts the Vercel cron secret or the older V3 secret. Exported for tests. */
export function isCronAuthorized(authHeader: string | undefined, env = process.env): boolean {
  const secrets = [env.CRON_SECRET, env.V3_CRON_SECRET].filter((s): s is string => !!s && s.length >= 16);
  if (!secrets.length) return false;
  const got = (authHeader || "").replace(/^Bearer\s+/i, "");
  return secrets.some((s) => s.length === got.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(got)));
}

function cron(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    if (!isCronAuthorized(req.headers.authorization)) return res.status(401).json({ error: "Unauthorized cron call" });
    try {
      await handler(req, res);
    } catch (e: any) {
      console.error("[cron] failed:", e);
      res.status(500).json({ error: e.message });
    }
  };
}

const publishDue = cron(async (_req, res) => res.json({ success: true, ...(await runDuePosts()) }));
jobsRouter.get("/cron/publish-scheduled", publishDue);
jobsRouter.post("/cron/publish-scheduled", publishDue);
jobsRouter.get("/publish/cron", publishDue);
jobsRouter.post("/publish/cron", publishDue);

const heartbeat = cron(async (_req, res) => res.json({ success: true, ...(await runHeartbeat()) }));
jobsRouter.get("/jobs/run", heartbeat);
jobsRouter.post("/jobs/run", heartbeat);

const fbSync = cron(async (_req, res) => res.json({ success: true, ...(await syncAllFacebook()) }));
jobsRouter.get("/cron/sync-facebook", fbSync);
jobsRouter.post("/cron/sync-facebook", fbSync);

// Agent runs take up to 30 seconds each, so they get their own endpoint instead of the heartbeat
const scheduledAgents = cron(async (_req, res) => res.json({ success: true, ...(await runDueScheduledAgents(50000)) }));
jobsRouter.get("/cron/scheduled-agents", scheduledAgents);
jobsRouter.post("/cron/scheduled-agents", scheduledAgents);

/* Manual Facebook refresh from the app */
jobsRouter.post("/facebook/sync", async (req: any, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const r = await syncFacebookForUser(userId);
  res.status(r.ok ? 200 : 502).json(r);
});

/* ── Facebook Page webhooks ── */
jobsRouter.get("/webhooks/facebook", (req, res) => {
  const verify = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  if (req.query["hub.mode"] === "subscribe" && verify && req.query["hub.verify_token"] === verify) return res.status(200).send(String(req.query["hub.challenge"] || ""));
  return res.sendStatus(403);
});

/** X-Hub-Signature-256 check. Exported for tests. */
export function validMetaSignature(rawBody: string, header: string | undefined, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return expected.length === header.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}

jobsRouter.post("/webhooks/facebook", async (req: any, res) => {
  if (!validMetaSignature(req.rawBody || "", req.headers["x-hub-signature-256"], process.env.FACEBOOK_APP_SECRET)) return res.sendStatus(401);
  // Answer fast; Meta retries slow endpoints
  res.sendStatus(200);
  try {
    for (const entry of req.body?.entry || []) {
      const pageId = String(entry.id);
      const { data: conns } = await supabaseAdmin.from("social_connections").select("user_id").eq("platform", "facebook").eq("platform_user_id", pageId).eq("is_active", true);
      for (const ch of entry.changes || []) {
        const v = ch.value || {};
        if (ch.field !== "feed" || v.item !== "comment") continue;
        if (v.from?.id === pageId) continue; // the Page's own replies
        for (const c of conns || []) {
          if (v.verb === "remove") {
            await supabaseAdmin.from("comments_inbox").update({ status: "archived" }).eq("user_id", c.user_id).eq("platform", "facebook").eq("platform_comment_id", v.comment_id);
            continue;
          }
          if (v.verb !== "add") continue;
          await ingestFacebookComment(
            c.user_id,
            { id: v.comment_id, message: v.message || "", created_time: new Date((v.created_time || Date.now() / 1000) * 1000).toISOString(), from: v.from, parent: v.parent_id && v.parent_id !== v.post_id ? { id: v.parent_id } : undefined, post_id: v.post_id },
            "webhook"
          );
        }
      }
    }
  } catch (e: any) {
    console.error("[webhook] facebook processing failed:", e.message);
  }
});
