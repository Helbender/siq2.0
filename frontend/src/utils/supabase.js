import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
// These should be set in your .env file or environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file",
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
