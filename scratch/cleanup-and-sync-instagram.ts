import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Import sync helpers dynamically since they use ES Modules / ts-node
import { syncAll } from "../server/utils/sync-instagram.js";

async function run() {
  console.log("Searching for connected Instagram accounts...");
  const { data: conns, error } = await supabaseAdmin
    .from("social_connections")
    .select("*")
    .eq("platform", "instagram")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching connections:", error.message);
    return;
  }

  if (!conns || conns.length === 0) {
    console.log("No active Instagram connections found.");
    return;
  }

  for (const conn of conns) {
    const userId = conn.user_id;
    console.log(`Found Instagram connection for user ${userId} (@${conn.platform_username}).`);
    
    console.log("Cleaning up legacy mock metrics, posts, and comments...");
    
    // Delete metric snapshots
    const { error: err1 } = await supabaseAdmin
      .from("metric_snapshots")
      .delete()
      .eq("user_id", userId);
    if (err1) console.error("Error deleting snapshots:", err1.message);

    // Delete inbox comments
    const { error: err2 } = await supabaseAdmin
      .from("comment_inbox")
      .delete()
      .eq("user_id", userId);
    if (err2) console.error("Error deleting comments:", err2.message);

    // Delete social posts
    const { error: err3 } = await supabaseAdmin
      .from("social_posts")
      .delete()
      .eq("user_id", userId);
    if (err3) console.error("Error deleting social posts:", err3.message);

    console.log("Legacy mock data removed successfully.");
    console.log("Triggering first real Instagram sync from Meta Graph API...");
    
    try {
      await syncAll(userId);
      console.log("Initial real sync complete!");
    } catch (syncErr: any) {
      console.error("Failed to run real sync:", syncErr.message);
    }
  }

  console.log("Done!");
}

run();
