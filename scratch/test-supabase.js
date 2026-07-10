import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log("Supabase URL:", supabaseUrl);
console.log("Service Key is defined:", !!supabaseServiceKey);
console.log("Service Key starts with:", supabaseServiceKey ? supabaseServiceKey.substring(0, 15) : "undefined");

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function test() {
  const { data, error } = await supabaseAdmin
    .from("oauth_states")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Database query failed:", error.message);
  } else {
    console.log("Database query succeeded! Table exists. Rows found:", data?.length);
  }
}

test();
