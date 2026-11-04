/*
  Data deletion (spec P0-5, 8.2).
  - deletePlatformData: removes everything ZieAds stored from one platform for one user.
    Runs on disconnect and on a platform's data deletion callback (Meta, TikTok).
  - deleteAccountData: removes every row for the user, then the auth user itself.
*/
import crypto from "crypto";
import { supabaseAdmin } from "./supabaseServer.js";

/** Platform aliases: one Meta deletion callback covers Facebook and Instagram */
const PLATFORM_GROUPS: Record<string, string[]> = {
  meta: ["facebook", "instagram", "threads", "meta_ads"],
  facebook: ["facebook"],
  instagram: ["instagram"],
  tiktok: ["tiktok", "tiktok_ads"],
  linkedin: ["linkedin"],
};

/** Tables that carry a platform column next to user_id */
const PLATFORM_TABLES = [
  "comments_inbox",
  "post_insights_cache",
  "account_insights_daily",
  "social_posts",
  "scheduled_posts",
  "connected_accounts",
  "social_connections",
];

async function safeDelete(table: string, apply: (q: any) => any): Promise<number> {
  try {
    const { error, count } = await apply(supabaseAdmin.from(table).delete({ count: "exact" }));
    if (error) {
      // A table missing in an older database is not a reason to fail the request
      console.warn(`[deletion] ${table}: ${error.message}`);
      return 0;
    }
    return count || 0;
  } catch (e: any) {
    console.warn(`[deletion] ${table}: ${e?.message}`);
    return 0;
  }
}

export async function deletePlatformData(userId: string, platform: string): Promise<Record<string, number>> {
  const platforms = PLATFORM_GROUPS[platform] || [platform];
  const out: Record<string, number> = {};
  // metric_snapshots hang off connected_accounts by account_id, remove them first
  try {
    const { data: accounts } = await supabaseAdmin
      .from("connected_accounts")
      .select("id")
      .eq("user_id", userId)
      .in("platform", platforms);
    const ids = (accounts || []).map((a: any) => a.id);
    if (ids.length) out.metric_snapshots = await safeDelete("metric_snapshots", (q) => q.in("account_id", ids));
  } catch {
    /* ignore */
  }
  for (const table of PLATFORM_TABLES) {
    out[table] = await safeDelete(table, (q) => q.eq("user_id", userId).in("platform", platforms));
  }
  if (platforms.includes("meta_ads") || platforms.includes("tiktok_ads")) {
    out.ad_data = await safeDelete("ad_data", (q) => q.eq("user_id", userId).in("platform", platforms));
  }
  return out;
}

/** Every table keyed by user_id. Most cascade from auth.users, this is the belt and braces pass. */
const USER_TABLES = [
  "agent_messages",
  "agent_conversations",
  "agent_usage",
  "agent_tasks",
  "scheduled_agents",
  "comments_inbox",
  "post_insights_cache",
  "account_insights_daily",
  "metric_snapshots",
  "social_posts",
  "scheduled_posts",
  "queue_slots",
  "media_library",
  "competitor_content",
  "competitors",
  "tracked_competitors",
  "ai_briefings",
  "anomaly_alerts",
  "ad_data",
  "audits",
  "skill_results",
  "brand_voice_profiles",
  "connected_accounts",
  "social_connections",
  "oauth_states",
  "mcp_keys",
  "mcp_usage",
  "team_members",
  "user_settings",
  "credit_transactions",
  "user_credits",
  "user_plan",
];

export async function deleteAccountData(userId: string): Promise<{ tables: Record<string, number>; authDeleted: boolean }> {
  const tables: Record<string, number> = {};
  // Extra brand workspaces go first: removing each hidden data user cascades to that brand's rows
  try {
    const { data: ws } = await supabaseAdmin.from("workspaces").select("data_user_id").eq("owner_id", userId);
    for (const w of ws || []) {
      if (w.data_user_id && w.data_user_id !== userId) {
        for (const t of USER_TABLES) await safeDelete(t, (q) => q.eq(t === "team_members" ? "owner_id" : "user_id", w.data_user_id));
        await supabaseAdmin.auth.admin.deleteUser(w.data_user_id).catch(() => undefined);
      }
    }
    tables.workspaces = await safeDelete("workspaces", (q) => q.eq("owner_id", userId));
  } catch {
    /* no workspaces table */
  }
  for (const t of USER_TABLES) {
    const col = t === "team_members" ? "owner_id" : "user_id";
    tables[t] = await safeDelete(t, (q) => q.eq(col, userId));
  }
  tables.profiles = await safeDelete("profiles", (q) => q.eq("id", userId));
  let authDeleted = false;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    authDeleted = !error;
    if (error) console.error("[deletion] auth user delete failed:", error.message);
  } catch (e: any) {
    console.error("[deletion] auth user delete failed:", e?.message);
  }
  return { tables, authDeleted };
}

/** Meta signed_request: base64url(signature).base64url(payload), HMAC-SHA256 with the app secret */
export function parseMetaSignedRequest(signedRequest: string, appSecret: string): any | null {
  try {
    const [encodedSig, payload] = String(signedRequest).split(".", 2);
    if (!encodedSig || !payload) return null;
    const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const expected = crypto.createHmac("sha256", appSecret).update(payload).digest();
    if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) return null;
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (data.algorithm && String(data.algorithm).toUpperCase() !== "HMAC-SHA256") return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Handle a platform's data deletion callback: find which ZieAds users connected
 * that platform account, delete the data, record the request for the status page.
 */
export async function handlePlatformDeletion(platform: "meta" | "tiktok" | "linkedin", platformUserId: string) {
  const confirmationCode = crypto.randomBytes(9).toString("base64url");
  const platforms = PLATFORM_GROUPS[platform] || [platform];
  const { data: conns } = await supabaseAdmin
    .from("social_connections")
    .select("user_id, platform, metadata")
    .in("platform", platforms)
    .eq("platform_user_id", String(platformUserId));

  // Facebook app-scoped ids are stored on the connection metadata for Pages
  let matches = conns || [];
  if (!matches.length && platform === "meta") {
    const { data: byMeta } = await supabaseAdmin
      .from("social_connections")
      .select("user_id, platform, metadata")
      .in("platform", platforms)
      .contains("metadata", { fb_user_id: String(platformUserId) });
    matches = byMeta || [];
  }

  const userIds = [...new Set(matches.map((m: any) => m.user_id))];
  for (const uid of userIds) await deletePlatformData(uid as string, platform);

  await supabaseAdmin.from("data_deletion_requests").insert({
    confirmation_code: confirmationCode,
    platform,
    platform_user_id: String(platformUserId),
    user_id: (userIds[0] as string) || null,
    status: userIds.length ? "completed" : "not_found",
    completed_at: new Date().toISOString(),
  });
  return { confirmationCode, deletedUsers: userIds.length };
}
