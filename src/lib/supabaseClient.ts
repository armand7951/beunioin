import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error("Supabase browser configuration is missing.");
}

export const supabase = createClient(
  supabaseUrl || "https://invalid.supabase.co",
  supabasePublishableKey || "missing-publishable-key",
);
