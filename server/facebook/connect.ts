/*
  Facebook Pages connection (spec P0-2).
  OAuth with Facebook Login for Business, list the Pages the person manages,
  store the chosen Page with its (non expiring) Page token, subscribe webhooks.

  social_connections row (platform "facebook"):
    platform_user_id  = Page id
    access_token      = encrypted Page token
    metadata.fb_user_id, metadata.pages[] (id, name, category, picture, token_enc),
    metadata.declined_permissions[]
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { exchangeCode, getMe, getPermissions, listPages, subscribePage, FbPage, FACEBOOK_SCOPES } from "../utils/facebookApi.js";
import { logActivity } from "../activity.js";

const REQUIRED_FOR_PUBLISH = ["pages_show_list", "pages_manage_posts", "pages_read_engagement"];

export interface FacebookPageConn {
  pageId: string;
  pageName: string;
  pageToken: string;
  scopes: string[];
}

function redirectBase() {
  return process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";
}

async function storePage(userId: string, page: FbPage, pages: FbPage[], fbUserId: string, granted: string[], declined: string[]) {
  const meta = {
    fb_user_id: fbUserId,
    category: page.category || null,
    pages: pages.map((p) => ({ id: p.id, name: p.name, category: p.category || null, picture: p.picture || null, token_enc: encrypt(p.access_token) })),
    declined_permissions: declined,
  };
  const { error } = await supabaseAdmin.from("social_connections").upsert(
    {
      user_id: userId,
      platform: "facebook",
      platform_user_id: page.id,
      platform_username: page.name,
      platform_display_name: page.name,
      platform_avatar_url: page.picture || "",
      platform_account_type: "PAGE",
      access_token: encrypt(page.access_token),
      refresh_token: null,
      // Page tokens made from a long-lived user token do not expire
      token_expires_at: null,
      scopes_granted: granted.join(","),
      is_active: true,
      status: "live",
      last_error_code: null,
      last_error_message: null,
      last_refreshed_at: new Date().toISOString(),
      metadata: meta,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,platform" }
  );
  if (error) throw new Error(error.message);

  // Mirror in connected_accounts so Composer, Calendar and Analytics see the Page
  await supabaseAdmin.from("connected_accounts").delete().eq("user_id", userId).eq("platform", "facebook").neq("platform_account_id", page.id);
  await supabaseAdmin.from("connected_accounts").upsert(
    {
      user_id: userId,
      platform: "facebook",
      platform_account_id: page.id,
      account_handle: page.name,
      connection_method: "oauth",
      is_active: true,
      connected_at: new Date().toISOString(),
      metadata: { is_real_oauth: true, page_name: page.name },
    },
    { onConflict: "user_id,platform,platform_account_id" }
  );
  await subscribePage(page.id, page.access_token);
  await logActivity(userId, "user", "connection.connected", "facebook_page", page.id, { name: page.name });
}

export async function handleFacebookCallback(req: any, res: any) {
  const base = redirectBase();
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${base}/connections?error=facebook_denied`);
  if (!code || !state) return res.redirect(`${base}/connections?error=facebook_invalid_callback`);
  try {
    const { data: st } = await supabaseAdmin.from("oauth_states").select("*").eq("state", state).eq("platform", "facebook").maybeSingle();
    if (!st) return res.redirect(`${base}/connections?error=facebook_csrf`);
    await supabaseAdmin.from("oauth_states").delete().eq("state", state);
    const userId = st.user_id as string;

    const { token: userToken } = await exchangeCode(String(code), `${base}/api/auth/facebook/callback`);
    const [me, perms, pages] = await Promise.all([getMe(userToken), getPermissions(userToken), listPages(userToken)]);
    const missing = REQUIRED_FOR_PUBLISH.filter((p) => !perms.granted.includes(p));
    if (!pages.length) return res.redirect(`${base}/connections?error=facebook_no_pages`);
    if (missing.length) console.warn(`[facebook] user ${userId} declined: ${missing.join(",")}`);

    // Keep the Page that was connected before, otherwise the first one; the user can switch
    const { data: existing } = await supabaseAdmin.from("social_connections").select("platform_user_id").eq("user_id", userId).eq("platform", "facebook").maybeSingle();
    const chosen = pages.find((p) => p.id === existing?.platform_user_id) || pages[0];
    await storePage(userId, chosen, pages, me.id, perms.granted, perms.declined);

    const q = new URLSearchParams({ connected: "facebook" });
    if (pages.length > 1) q.set("choose_page", "1");
    if (missing.length) q.set("missing", missing.join(","));
    return res.redirect(`${base}/connections?${q.toString()}`);
  } catch (e: any) {
    console.error("[facebook] callback failed:", e.message);
    return res.redirect(`${base}/connections?error=facebook_callback_failed`);
  }
}

export async function listFacebookPages(userId: string) {
  const { data } = await supabaseAdmin.from("social_connections").select("platform_user_id, metadata").eq("user_id", userId).eq("platform", "facebook").eq("is_active", true).maybeSingle();
  if (!data) return { selected: null, pages: [] };
  const pages = ((data.metadata as any)?.pages || []).map((p: any) => ({ id: p.id, name: p.name, category: p.category, picture: p.picture }));
  return { selected: data.platform_user_id, pages };
}

export async function selectFacebookPage(userId: string, pageId: string) {
  const { data } = await supabaseAdmin.from("social_connections").select("*").eq("user_id", userId).eq("platform", "facebook").eq("is_active", true).maybeSingle();
  if (!data) throw new Error("Facebook is not connected");
  const meta: any = data.metadata || {};
  const p = (meta.pages || []).find((x: any) => x.id === pageId);
  if (!p) throw new Error("That Page is not in your Facebook account");
  const pages: FbPage[] = meta.pages.map((x: any) => ({ id: x.id, name: x.name, category: x.category, picture: x.picture, access_token: decrypt(x.token_enc) }));
  const chosen = pages.find((x) => x.id === pageId)!;
  await storePage(userId, chosen, pages, meta.fb_user_id, String(data.scopes_granted || "").split(",").filter(Boolean), meta.declined_permissions || []);
  return { id: chosen.id, name: chosen.name };
}

/** Active Page with decrypted token, or null */
export async function getFacebookPage(userId: string): Promise<FacebookPageConn | null> {
  const { data } = await supabaseAdmin
    .from("social_connections")
    .select("platform_user_id, platform_username, access_token, scopes_granted")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  try {
    return { pageId: data.platform_user_id, pageName: data.platform_username || "", pageToken: decrypt(data.access_token), scopes: String(data.scopes_granted || "").split(",").filter(Boolean) };
  } catch {
    return null;
  }
}

export { FACEBOOK_SCOPES };
