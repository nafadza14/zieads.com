/*
  Workspaces, one per brand (the Publer "workspace" and Metricool "brand" pattern).
  Every account has a Main workspace whose data user is the account itself, so existing data stays put.
  An extra workspace gets its own hidden data user: connections, posts, comments, competitors, brand
  profile, media and briefings are then separate per brand without changing any query.
  Brand limits per plan: Free 1, Starter 1, Pro 3, Agency 10 (the pricing page).
*/
import crypto from "crypto";
import { supabaseAdmin, getEffectivePlan, forgetWorkspaceCache } from "./supabaseServer.js";
import { PLAN_LIMITS } from "./creditConfig.js";

/** Brands per plan come from PLAN_LIMITS (Free 1, Starter 1, Pro 3, Agency 10) */
const brandLimit = (plan: string) => (PLAN_LIMITS as any)[plan]?.brands ?? 1;
const NEEDS: Record<string, string> = { free: "Pro", starter: "Pro", pro: "Agency", agency: "Agency" };

export class WorkspaceError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  is_main: boolean;
  created_at: string;
  accounts?: number;
}

const COLORS = ["#F26522", "#2F8A57", "#3B6FD8", "#8A4FD8", "#C27C0E", "#D0443A", "#0E8C8C", "#555555"];
const cleanName = (n: unknown) => String(n || "").replace(/\s+/g, " ").trim().slice(0, 40);

/** Main workspace: created on first use, named after the brand profile when there is one */
export async function ensureMain(accountId: string): Promise<void> {
  const { data } = await supabaseAdmin.from("workspaces").select("id").eq("owner_id", accountId).eq("data_user_id", accountId).maybeSingle();
  if (data) return;
  let name = "Main";
  try {
    const { data: p } = await supabaseAdmin.from("profiles").select("business_name").eq("id", accountId).maybeSingle();
    if (p?.business_name) name = cleanName(p.business_name) || name;
  } catch {
    /* profile is optional */
  }
  await supabaseAdmin.from("workspaces").upsert({ owner_id: accountId, data_user_id: accountId, name, color: COLORS[0], position: 0 }, { onConflict: "data_user_id", ignoreDuplicates: true });
}

export async function listWorkspaces(accountId: string) {
  await ensureMain(accountId);
  const { data, error } = await supabaseAdmin.from("workspaces").select("id, name, color, data_user_id, position, created_at").eq("owner_id", accountId).is("archived_at", null).order("position", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw new WorkspaceError("Run the workspaces migration in Supabase first.", 500, "migration_needed");
  const rows = data || [];
  const { data: conns } = await supabaseAdmin.from("social_connections").select("user_id, platform").in("user_id", rows.map((r: any) => r.data_user_id)).eq("is_active", true);
  const plan = await getEffectivePlan(accountId);
  // Keep each brand's plan row equal to the account's, for any check that reads it directly
  const extra = rows.filter((r: any) => r.data_user_id !== accountId).map((r: any) => r.data_user_id);
  if (extra.length) {
    const { data: ownerPlan } = await supabaseAdmin.from("user_plan").select("plan_id").eq("user_id", accountId).maybeSingle();
    if (ownerPlan?.plan_id) await supabaseAdmin.from("user_plan").update({ plan_id: ownerPlan.plan_id }).in("user_id", extra).then(() => undefined, () => undefined);
  }
  return {
    plan,
    limit: brandLimit(plan),
    workspaces: rows.map((r: any): Workspace & { platforms: string[] } => {
      const mine = (conns || []).filter((c: any) => c.user_id === r.data_user_id);
      return { id: r.id, name: r.name, color: r.color || COLORS[0], is_main: r.data_user_id === accountId, created_at: r.created_at, accounts: mine.length, platforms: [...new Set(mine.map((c: any) => c.platform))] };
    }),
  };
}

export async function createWorkspace(accountId: string, rawName: string) {
  const name = cleanName(rawName);
  if (!name) throw new WorkspaceError("Give the workspace a name, for example the brand name.", 400, "name_required");
  const { workspaces, plan, limit } = await listWorkspaces(accountId);
  if (workspaces.length >= limit) {
    throw new WorkspaceError(
      limit <= 1 ? `Your ${plan} plan includes one brand. Upgrade to ${NEEDS[plan]} to add more workspaces.` : `Your ${plan} plan includes ${limit} brands. Upgrade to ${NEEDS[plan]} for more.`,
      403,
      "limit_reached"
    );
  }
  if (workspaces.some((w) => w.name.toLowerCase() === name.toLowerCase())) throw new WorkspaceError("You already have a workspace with that name.", 409, "duplicate");

  // The hidden data user: no mailbox, random password nobody knows, flagged so it can never sign in
  const tag = crypto.randomBytes(8).toString("hex");
  const { data: made, error } = await supabaseAdmin.auth.admin.createUser({
    email: `ws-${tag}@workspaces.zieads.com`,
    password: crypto.randomBytes(32).toString("base64url"),
    email_confirm: true,
    app_metadata: { kind: "workspace", owner_id: accountId },
    user_metadata: { workspace_name: name },
  });
  if (error || !made?.user) throw new WorkspaceError(`Could not create the workspace: ${error?.message || "unknown error"}`, 500, "create_failed");
  const dataUser = made.user.id;
  // The new brand inherits the account's plan row so plan checks keyed on the data user also agree
  const { data: ownerPlan } = await supabaseAdmin.from("user_plan").select("plan_id").eq("user_id", accountId).maybeSingle();
  await supabaseAdmin.from("user_plan").upsert({ user_id: dataUser, plan_id: ownerPlan?.plan_id || plan }, { onConflict: "user_id" }).then(() => undefined, () => undefined);
  await supabaseAdmin.from("profiles").upsert({ id: dataUser, business_name: name }, { onConflict: "id" }).then(() => undefined, () => undefined);

  const { data: ws, error: wErr } = await supabaseAdmin
    .from("workspaces")
    .insert({ owner_id: accountId, data_user_id: dataUser, name, color: COLORS[workspaces.length % COLORS.length], position: workspaces.length })
    .select("id, name, color, created_at")
    .single();
  if (wErr || !ws) {
    await supabaseAdmin.auth.admin.deleteUser(dataUser).catch(() => undefined);
    throw new WorkspaceError(`Could not save the workspace: ${wErr?.message || "unknown error"}`, 500, "create_failed");
  }
  forgetWorkspaceCache();
  return { id: ws.id, name: ws.name, color: ws.color, is_main: false, created_at: ws.created_at, accounts: 0, platforms: [] };
}

async function owned(accountId: string, id: string) {
  const { data } = await supabaseAdmin.from("workspaces").select("id, data_user_id, name").eq("id", id).eq("owner_id", accountId).is("archived_at", null).maybeSingle();
  if (!data) throw new WorkspaceError("Workspace not found.", 404, "not_found");
  return data;
}

export async function renameWorkspace(accountId: string, id: string, patch: { name?: string; color?: string }) {
  await owned(accountId, id);
  const update: Record<string, string> = {};
  if (patch.name !== undefined) {
    const name = cleanName(patch.name);
    if (!name) throw new WorkspaceError("Give the workspace a name.", 400, "name_required");
    update.name = name;
  }
  if (patch.color && /^#[0-9a-f]{6}$/i.test(patch.color)) update.color = patch.color;
  await supabaseAdmin.from("workspaces").update(update).eq("id", id);
  return { success: true };
}

/** Deletes the brand and everything in it. The Main workspace can not be deleted. */
export async function deleteWorkspace(accountId: string, id: string, confirmName: string) {
  const ws = await owned(accountId, id);
  if (ws.data_user_id === accountId) throw new WorkspaceError("The Main workspace holds your account and can not be deleted.", 400, "main");
  if (cleanName(confirmName).toLowerCase() !== String(ws.name).toLowerCase()) throw new WorkspaceError("Type the workspace name to confirm.", 400, "confirm");
  // Removing the data user cascades to every row that belongs to the brand
  const { error } = await supabaseAdmin.auth.admin.deleteUser(ws.data_user_id);
  if (error) throw new WorkspaceError(`Could not delete the workspace: ${error.message}`, 500, "delete_failed");
  await supabaseAdmin.from("workspaces").delete().eq("id", id);
  forgetWorkspaceCache();
  return { success: true };
}

/** Every data user of an account, for account level jobs (export, account deletion) */
export async function workspaceDataUsers(accountId: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from("workspaces").select("data_user_id").eq("owner_id", accountId);
  return (data || []).map((r: any) => r.data_user_id).filter((d: string) => d !== accountId);
}
