import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from "@supabase/supabase-js";

// Read .env file
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

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
    } catch (err) {
      console.log(`Table "${t}" exception:`, err.message);
    }
  }
}

check();
