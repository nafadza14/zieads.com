import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  "scheduled_posts",
  "media_library",
  "post_insights_cache",
  "account_insights_daily",
  "comments_inbox",
  "ai_briefings",
  "competitors"
];

async function verify() {
  console.log("=== VERIFYING ZIEADS V0.3 FOUNDATION TABLES ===");
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select("*").limit(1);
      if (error) {
        if (error.message.includes("does not exist") || error.code === "P0001" || error.code === "42P01") {
          console.error(`❌ Table "${table}" DOES NOT EXIST! Error code: ${error.code || 'unknown'}, msg: ${error.message}`);
        } else {
          console.log(`⚠️ Table "${table}" queries with warning/error (likely fine if RLS blocks):`, error.message);
        }
      } else {
        console.log(`✅ Table "${table}" EXISTS and queries successfully!`);
      }
    } catch (err: any) {
      console.error(`❌ Exception querying table "${table}":`, err.message);
    }
  }

  // Verify RLS logic check: query with anon/user client vs service role
  console.log("\n=== TESTING RLS VERIFICATION ===");
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
  if (anonKey) {
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAnon.from(table).select("*").limit(1);
        if (error) {
          console.log(`✅ RLS active or error on table "${table}" using Anon client:`, error.message);
        } else {
          // If it succeeded, check if we got empty array (since anon is unauthenticated user and RLS should not return anything or fail)
          console.log(`ℹ️ Anon client query for "${table}" returned:`, data);
        }
      } catch (err: any) {
        console.log(`✅ Anon client blocked/errored on "${table}":`, err.message);
      }
    }
  } else {
    console.log("⚠️ No VITE_SUPABASE_ANON_KEY found in .env, skipping Anon client RLS check.");
  }
}

verify();
