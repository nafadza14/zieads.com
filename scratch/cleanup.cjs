const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

    console.log("Legacy mock data removed successfully. Next load of the dashboard on live will trigger a fresh, real sync.");
  }

  console.log("Done!");
}

run();
