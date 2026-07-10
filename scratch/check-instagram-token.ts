import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getDecryptedToken } from "../server/utils/tokenHelper.js";
import { getProfile } from "../server/utils/instagramApi.js";
import { syncAll } from "../server/utils/sync-instagram.js";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("Fetching connections...");
  const { data: conns, error } = await supabaseAdmin
    .from("social_connections")
    .select("*")
    .eq("platform", "instagram")
    .eq("is_active", true);

  if (error) {
    console.error("Database query failed:", error.message);
    return;
  }

  if (!conns || conns.length === 0) {
    console.log("No active Instagram connections found in the database.");
    return;
  }

  for (const conn of conns) {
    const userId = conn.user_id;
    console.log(`Found connection for user ${userId} (@${conn.platform_username}).`);
    
    console.log("Decrypting token and testing Meta Graph API connection...");
    const connDetails = await getDecryptedToken(userId, "instagram");
    if (!connDetails) {
      console.error("Failed to decrypt or find token details.");
      continue;
    }

    try {
      console.log("Token successfully decrypted. Calling Meta /me endpoint...");
      const profile = await getProfile(connDetails.token);
      console.log("Meta Graph API Response: SUCCESS!");
      console.log("Profile details:", JSON.stringify(profile, null, 2));

      console.log("Clearing any old mock data for this user to ensure fresh sync...");
      await supabaseAdmin.from("social_posts").delete().eq("user_id", userId);
      await supabaseAdmin.from("metric_snapshots").delete().eq("user_id", userId);
      await supabaseAdmin.from("comment_inbox").delete().eq("user_id", userId);

      console.log("Triggering syncAll manually...");
      await syncAll(userId);
      console.log("Sync complete! Please refresh your dashboard.");
    } catch (err: any) {
      console.error("Meta Graph API connection failed:", err.message);
    }
  }
}

run();
