import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('CRITICAL: Missing Supabase environment variables. Database features will fail. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
