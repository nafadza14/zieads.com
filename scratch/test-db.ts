import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Starts With:", supabaseServiceKey.slice(0, 10));

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function test() {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("*").limit(1);
    if (error) {
      console.error("Query failed with error:", error);
    } else {
      console.log("Query succeeded! Data count:", data.length);
      console.log("Data sample:", data);
    }
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
