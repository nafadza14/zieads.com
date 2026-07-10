const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkColumns() {
  console.log("Checking columns for 'media_library' table...");
  const { data, error } = await supabaseAdmin.rpc('get_table_columns_info', {}, {
    // If RPC doesn't exist, we can use a direct SQL raw query through supabase if we have it, or query a known view,
    // or try querying columns by select.
  });
  
  // Since we might not have 'get_table_columns_info' RPC, let's do a direct select on a dummy row, or use postgres info schema via supabase query.
  // Actually, we can run a custom query using the REST API if we query information_schema or run a raw sql function.
  // Let's try querying postgrest schema info:
  try {
    const { data: cols, error: colErr } = await supabaseAdmin
      .from('media_library')
      .select('*')
      .limit(0); // get headers
    
    if (colErr) {
      console.error("Failed to select:", colErr.message);
    } else {
      console.log("Select returned columns (via keys):", cols);
    }
  } catch (e) {
    console.error(e);
  }

  // Let's also do a direct check: does inserting a row without blob_pathname succeed?
  // Let's query information_schema.columns via an RPC or query if allowed.
  // In many Supabase setups, you can query a view or function. Let's check.
}

checkColumns();
