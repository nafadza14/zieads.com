/*
  Settings API (spec P0-1, 7.11, P0-5)
  GET  /api/settings                 notifications, briefing time, checklist, plan limits
  POST /api/settings                 save notification and briefing preferences
  GET  /api/settings/team            team members and seat limit
  POST /api/settings/team            invite a member (email + role)
  POST /api/settings/team/:id/revoke remove a member
  GET  /api/settings/activity        activity log (who did what)
  GET  /api/settings/export          download every row ZieAds keeps about the user (JSON)
  POST /api/settings/delete-account  delete all data and the login (needs confirm: "DELETE")
  POST /api/client-errors            error reports from the ErrorBoundary (no auth)
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS, withinLimit } from "../creditConfig.js";
import { logActivity } from "../activity.js";
import { deleteAccountData } from "../dataDeletion.js";

export const settingsRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const DEFAULTS = {
  briefing_time: "07:00",
  timezone: "Asia/Jakarta",
  briefing_channels: { in_app: true, email: true, push: false },
  alert_threshold_pct: 25,
  unanswered_hours: 2,
  checklist: {},
  preferences: {},
};

export async function getUserSettings(userId: string) {
  const { data } = await supabaseAdmin.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  return { ...DEFAULTS, ...(data || {}), user_id: userId };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ROLES = ["admin", "editor", "viewer", "client"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Validates and normalises a settings patch. Exported for tests. */
export function sanitizeSettingsPatch(body: any): { patch: Record<string, unknown>; errors: string[] } {
  const patch: Record<string, unknown> = {};
  const errors: string[] = [];
  if (body?.briefing_time !== undefined) {
    if (TIME_RE.test(String(body.briefing_time))) patch.briefing_time = String(body.briefing_time);
    else errors.push("Briefing time must look like 07:00");
  }
  if (body?.timezone !== undefined) {
    if (isValidTimezone(String(body.timezone))) patch.timezone = String(body.timezone);
    else errors.push("Unknown time zone");
  }
  if (body?.briefing_channels !== undefined) {
    const c = body.briefing_channels || {};
    patch.briefing_channels = { in_app: c.in_app !== false, email: !!c.email, push: !!c.push };
  }
  if (body?.alert_threshold_pct !== undefined) {
    const n = Number(body.alert_threshold_pct);
    if (Number.isFinite(n) && n >= 5 && n <= 100) patch.alert_threshold_pct = Math.round(n);
    else errors.push("Alert threshold must be between 5 and 100 percent");
  }
  if (body?.unanswered_hours !== undefined) {
    const n = Number(body.unanswered_hours);
    if (Number.isFinite(n) && n >= 1 && n <= 72) patch.unanswered_hours = Math.round(n);
    else errors.push("Unanswered hours must be between 1 and 72");
  }
  if (body?.checklist !== undefined && typeof body.checklist === "object") {
    const out: Record<string, boolean | string> = {};
    for (const [k, v] of Object.entries(body.checklist)) if (/^[a-z_]{2,40}$/.test(k)) out[k] = v === "dismissed" ? "dismissed" : !!v;
    patch.checklist = out;
  }
  return { patch, errors };
}

settingsRouter.post("/client-errors", async (req: any, res) => {
  const b = req.body || {};
  // Logged as one structured line so it is searchable in Vercel logs
  console.error(
    "[client-error]",
    JSON.stringify({
      area: String(b.area || "app").slice(0, 60),
      path: String(b.path || "").slice(0, 200),
      message: String(b.message || "").slice(0, 500),
      stack: String(b.stack || "").slice(0, 2000),
      componentStack: String(b.componentStack || "").slice(0, 1000),
      ua: String(req.headers["user-agent"] || "").slice(0, 200),
    })
  );
  res.status(204).end();
});

settingsRouter.get("/settings", requireAuth, async (req: any, res) => {
  const [settings, plan] = await Promise.all([getUserSettings(req.userId), getEffectivePlan(req.userId)]);
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(req.userId);
  res.json({
    success: true,
    settings,
    plan,
    limits: PLAN_LIMITS[plan],
    account: {
      email: user?.user?.email || null,
      created_at: user?.user?.created_at || null,
      provider: user?.user?.app_metadata?.provider || "email",
    },
  });
});

settingsRouter.post("/settings", requireAuth, async (req: any, res) => {
  const { patch, errors } = sanitizeSettingsPatch(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(". ") });
  const current = await getUserSettings(req.userId);
  const row: any = { user_id: req.userId, updated_at: new Date().toISOString(), ...patch };
  // Checklist keys merge so two tabs never wipe each other's progress
  if (patch.checklist) row.checklist = { ...(current.checklist || {}), ...(patch.checklist as object) };
  // Saving a briefing time ticks the activation checklist item
  if (patch.briefing_time) row.checklist = { ...(row.checklist || current.checklist || {}), set_briefing_time: true };
  const { data, error } = await supabaseAdmin.from("user_settings").upsert(row, { onConflict: "user_id" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logActivity(req.userId, "user", "settings.updated", "user_settings", req.userId, { fields: Object.keys(patch) });
  res.json({ success: true, settings: { ...DEFAULTS, ...data } });
});

settingsRouter.get("/settings/team", requireAuth, async (req: any, res) => {
  const plan = await getEffectivePlan(req.userId);
  const { data } = await supabaseAdmin
    .from("team_members")
    .select("id, email, role, status, invited_at")
    .eq("owner_id", req.userId)
    .neq("status", "revoked")
    .order("invited_at", { ascending: true });
  res.json({ success: true, members: data || [], seats: PLAN_LIMITS[plan].teamSeats, plan });
});

settingsRouter.post("/settings/team", requireAuth, async (req: any, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const role = String(req.body?.role || "editor");
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (!ROLES.includes(role)) return res.status(400).json({ error: "Role must be admin, editor, viewer or client" });
  const plan = await getEffectivePlan(req.userId);
  const { count } = await supabaseAdmin
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", req.userId)
    .neq("status", "revoked");
  // The owner uses one seat
  if (!withinLimit(PLAN_LIMITS[plan].teamSeats, (count || 0) + 1)) {
    return res.status(403).json({ error: `Your ${plan} plan includes ${PLAN_LIMITS[plan].teamSeats} seat${PLAN_LIMITS[plan].teamSeats === 1 ? "" : "s"}. Upgrade to invite more people.`, code: "SEAT_LIMIT" });
  }
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .upsert({ owner_id: req.userId, email, role, status: "invited", invited_at: new Date().toISOString() }, { onConflict: "owner_id,email" })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  await logActivity(req.userId, "user", "team.invited", "team_member", data.id, { email, role });
  res.json({ success: true, member: data });
});

settingsRouter.post("/settings/team/:id/revoke", requireAuth, async (req: any, res) => {
  const { error } = await supabaseAdmin.from("team_members").update({ status: "revoked" }).eq("id", req.params.id).eq("owner_id", req.userId);
  if (error) return res.status(500).json({ error: error.message });
  await logActivity(req.userId, "user", "team.revoked", "team_member", req.params.id);
  res.json({ success: true });
});

settingsRouter.get("/settings/activity", requireAuth, async (req: any, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const { data } = await supabaseAdmin
    .from("activity_log")
    .select("id, actor, action, object_type, object_id, detail, created_at")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  res.json({ success: true, items: data || [] });
});

/** Tables included in the export. Tokens are never exported. */
const EXPORT_TABLES: Array<[string, string, string]> = [
  ["profiles", "id", "*"],
  ["user_settings", "user_id", "*"],
  ["user_plan", "user_id", "plan_id, plan_started_at"],
  ["social_connections", "user_id", "platform, platform_username, platform_display_name, connected_at, token_expires_at, scopes_granted, status"],
  ["scheduled_posts", "user_id", "*"],
  ["comments_inbox", "user_id", "*"],
  ["competitors", "user_id", "*"],
  ["ai_briefings", "user_id", "*"],
  ["agent_conversations", "user_id", "*"],
  ["agent_messages", "user_id", "*"],
  ["agent_tasks", "user_id", "*"],
  ["activity_log", "user_id", "*"],
  ["ad_data", "user_id", "*"],
  ["team_members", "owner_id", "email, role, status, invited_at"],
];

settingsRouter.get("/settings/export", requireAuth, async (req: any, res) => {
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: req.userId };
  for (const [table, col, cols] of EXPORT_TABLES) {
    const { data, error } = await supabaseAdmin.from(table).select(cols).eq(col, req.userId).limit(5000);
    out[table] = error ? { error: error.message } : data;
  }
  await logActivity(req.userId, "user", "data.exported");
  res.setHeader("Content-Disposition", `attachment; filename="zieads-export-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(out);
});

settingsRouter.post("/settings/delete-account", requireAuth, async (req: any, res) => {
  if (req.body?.confirm !== "DELETE") return res.status(400).json({ error: 'Type DELETE to confirm' });
  const result = await deleteAccountData(req.userId);
  console.log(`[deletion] account ${req.userId} deleted`, JSON.stringify(result.tables));
  res.json({ success: true, authDeleted: result.authDeleted });
});

/** Public status lookup for a deletion confirmation code (Meta needs a status URL) */
settingsRouter.get("/data-deletion/status", async (req: any, res) => {
  const code = String(req.query.code || "").trim();
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(code)) return res.status(400).json({ error: "Enter a valid confirmation code" });
  const { data } = await supabaseAdmin.from("data_deletion_requests").select("status, platform, completed_at").eq("confirmation_code", code).maybeSingle();
  if (!data) return res.status(404).json({ error: "We could not find that confirmation code." });
  res.json(data);
});
