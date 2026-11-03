/*
  Agent tasks: the approval queue (spec 2.2 "Nothing runs without you", 7.2, 7.3, 10.1).
  GET  /tasks                 pending tasks (or ?status=all for the last 100)
  POST /tasks/:id/approve     run the task now; result is stored and logged
  POST /tasks/:id/dismiss     close it without running
  GET  /guardian/status       connection health, open problems and weekly reliability
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { logActivity } from "../activity.js";
import { publishScheduledPost } from "../publish/publisher.js";
import { sendCommentReply, ReplyError } from "../inbox/reply.js";
import { reliabilityReport } from "../guardian/guardian.js";

export const tasksRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

tasksRouter.get("/tasks", requireAuth, async (req: any, res) => {
  let q = supabaseAdmin.from("agent_tasks").select("*").eq("user_id", req.userId).order("created_at", { ascending: false }).limit(100);
  if (req.query.status !== "all") q = q.eq("status", "pending_approval");
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, tasks: data || [] });
});

export interface TaskOutcome {
  status: "executed" | "failed";
  result: Record<string, unknown>;
  /** Where the app should take the user next, for tasks a person finishes */
  next?: string;
}

/** Runs one approved task. Exported so MCP approve_action uses the same path. */
export async function executeTask(userId: string, task: any): Promise<TaskOutcome> {
  const p = task.payload || {};
  switch (task.kind) {
    case "reconnect":
      return { status: "executed", result: { platform: p.platform }, next: `/connections` };
    case "reply_comments":
      return { status: "executed", result: { count: p.count }, next: "/inbox?filter=needs_reply" };
    case "manual_publish":
      return { status: "executed", result: { post_id: p.post_id }, next: `/calendar?post=${p.post_id}` };
    case "quota_warning":
      return { status: "executed", result: {} };
    case "review_failed_post": {
      await supabaseAdmin.from("scheduled_posts").update({ status: "scheduled", retry_count: 0, scheduled_for: new Date().toISOString(), error_message: null }).eq("id", p.post_id).eq("user_id", userId).in("status", ["failed"]);
      const r = await publishScheduledPost(p.post_id);
      return { status: r.status === "failed" ? "failed" : "executed", result: r as any };
    }
    case "schedule_post": {
      // A draft the agent or MCP prepared: approving puts it on the schedule
      const { data: post } = await supabaseAdmin.from("scheduled_posts").select("id, status, scheduled_for").eq("id", p.post_id).eq("user_id", userId).maybeSingle();
      if (!post) return { status: "failed", result: { error: "Post not found" } };
      const when = p.scheduled_for || post.scheduled_for;
      const future = when && new Date(when).getTime() > Date.now() + 60000;
      await supabaseAdmin.from("scheduled_posts").update({ status: future ? "scheduled" : "approved", scheduled_for: when || null }).eq("id", post.id);
      return { status: "executed", result: { post_id: post.id, status: future ? "scheduled" : "approved" } };
    }
    case "send_reply": {
      try {
        const r = await sendCommentReply(userId, p.comment_id, p.text, task.created_by === "mcp" ? "mcp" : "agent");
        return { status: "executed", result: r };
      } catch (e: any) {
        return { status: "failed", result: { error: e.message, code: e instanceof ReplyError ? e.code : undefined } };
      }
    }
    case "add_competitor": {
      const { data, error } = await supabaseAdmin.from("competitors").insert({ user_id: userId, name: p.name, website_url: p.website_url, instagram_username: p.instagram_username || null }).select("id").single();
      return error ? { status: "failed", result: { error: error.message } } : { status: "executed", result: { competitor_id: data.id } };
    }
    default:
      return { status: "executed", result: {}, next: p.next };
  }
}

tasksRouter.post("/tasks/:id/approve", requireAuth, async (req: any, res) => {
  // Claim: only a pending task can be approved, once
  const { data: task } = await supabaseAdmin
    .from("agent_tasks")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .eq("status", "pending_approval")
    .select()
    .maybeSingle();
  if (!task) return res.status(409).json({ error: "This action was already handled." });
  await logActivity(req.userId, "user", "task.approved", "agent_task", task.id, { kind: task.kind, title: task.title });
  const out = await executeTask(req.userId, task);
  await supabaseAdmin.from("agent_tasks").update({ status: out.status, result: out.result, executed_at: new Date().toISOString() }).eq("id", task.id);
  await logActivity(req.userId, task.created_by === "mcp" ? "mcp" : "agent", `task.${out.status}`, "agent_task", task.id, { kind: task.kind });
  res.status(out.status === "failed" ? 502 : 200).json({ success: out.status === "executed", status: out.status, result: out.result, next: out.next });
});

tasksRouter.post("/tasks/:id/dismiss", requireAuth, async (req: any, res) => {
  const { data } = await supabaseAdmin
    .from("agent_tasks")
    .update({ status: "dismissed", decided_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .eq("status", "pending_approval")
    .select("id, kind, title")
    .maybeSingle();
  if (!data) return res.status(409).json({ error: "This action was already handled." });
  await logActivity(req.userId, "user", "task.dismissed", "agent_task", data.id, { kind: data.kind, title: data.title });
  res.json({ success: true });
});

tasksRouter.get("/guardian/status", requireAuth, async (req: any, res) => {
  const [{ data: conns }, { data: failed }, { data: tasks }, reliability] = await Promise.all([
    supabaseAdmin.from("social_connections").select("platform, platform_username, status, last_synced_at, token_expires_at, last_error_message").eq("user_id", req.userId).eq("is_active", true),
    supabaseAdmin.from("scheduled_posts").select("id, platform, caption, error_message, updated_at, status").eq("user_id", req.userId).in("status", ["failed", "needs_action"]).order("updated_at", { ascending: false }).limit(20),
    supabaseAdmin.from("agent_tasks").select("id, kind, title, detail, created_at, created_by").eq("user_id", req.userId).eq("status", "pending_approval").eq("created_by", "guardian").order("created_at", { ascending: false }).limit(20),
    reliabilityReport(req.userId, 7),
  ]);
  res.json({ success: true, connections: conns || [], problem_posts: failed || [], guardian_tasks: tasks || [], reliability });
});
