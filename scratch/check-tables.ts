import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function check() {
  const tables = [
    "superadmin_users",
    "superadmin_audit_log",
    "api_keys",
    "api_usage_logs",
    "system_alerts",
    "user_notes"
  ];
  for (const t of tables) {
    try {
      const { error } = await supabaseAdmin.from(t).select("*").limit(1);
      if (error && error.message.includes("does not exist")) {
        console.log(`Table "${t}" does not exist.`);
      } else if (error) {
        console.log(`Table "${t}" error:`, error.message);
      } else {
        console.log(`Table "${t}" EXISTS!`);
      }
    } catch (err: any) {
      console.log(`Table "${t}" exception:`, err.message);
    }
  }
}

check();
