import { supabaseAdmin } from "../server/supabaseServer.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  console.log("Supabase URL:", process.env.VITE_SUPABASE_URL);
  console.log("Service Key defined:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
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
