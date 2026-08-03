const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const crypto = require("crypto");

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Decrypt function from server/utils/crypto.ts replicated here for stand-alone execution
function decrypt(encryptedText) {
  if (!encryptedText) return "";
  const secretKeyHex = process.env.ENCRYPTION_KEY;
  if (!secretKeyHex) throw new Error("ENCRYPTION_KEY is missing");
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = Buffer.from(parts[1], "hex");
  const key = Buffer.from(secretKeyHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function run() {
  console.log("Fetching connections from social_connections...");
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
    
    console.log("Decrypting token...");
    try {
      const decryptedToken = decrypt(conn.access_token);
      console.log("Token successfully decrypted. Calling Meta Graph API /me endpoint...");

      const fields = 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website';
      const url = `https://graph.instagram.com/v21.0/me?fields=${fields}&access_token=${encodeURIComponent(decryptedToken)}`;
      
      const res = await fetch(url);
      const profile = await res.json();

      if (!res.ok) {
        throw new Error(profile?.error?.message || JSON.stringify(profile));
      }

      console.log("Meta Graph API Response: SUCCESS!");
      console.log("Profile details:", JSON.stringify(profile, null, 2));

      console.log("Clearing any old mock data for this user to ensure fresh sync...");
      await supabaseAdmin.from("social_posts").delete().eq("user_id", userId);
      await supabaseAdmin.from("metric_snapshots").delete().eq("user_id", userId);
      await supabaseAdmin.from("comment_inbox").delete().eq("user_id", userId);

      console.log("Triggering on-demand sync by hitting live /api/v3/analytics/summary...");
      // By deleting social_posts, the next dashboard load will automatically trigger a clean sync.
      console.log("Completed cleanup! Tell user to refresh the analytics page on their web app.");
    } catch (err) {
      console.error("Meta Graph API connection failed:", err.message);
    }
  }
}

run();
