import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function test() {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Service Key is defined:", !!supabaseServiceKey);
  console.log("Service Key starts with:", supabaseServiceKey.slice(0, 15));

  const { data: conns, error: err1 } = await supabaseAdmin.from("social_connections").select("*");
  if (err1) console.error("social_connections error:", err1.message);
  else console.log("social_connections count:", conns?.length, conns);

  const { data: accounts, error: err2 } = await supabaseAdmin.from("connected_accounts").select("*");
  if (err2) console.error("connected_accounts error:", err2.message);
  else console.log("connected_accounts count:", accounts?.length, accounts);
}

test();
