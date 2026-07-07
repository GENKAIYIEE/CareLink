// src/lib/supabase-server.ts
// Server-only Supabase client using the SERVICE ROLE key.
// ⚠ Never import this file from client components — the service role key
//   must NEVER be exposed to the browser.
//
// Used for:
//   • Photo uploads (Supabase Storage) — bypasses Row Level Security
//   • Any future privileged server-side Supabase operations

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceRoleKey) {
  console.warn(
    "[CareLink] SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Photo uploads to Supabase Storage will fail. " +
      "Add this key to your .env and Vercel environment variables."
  );
}

export const supabaseServer = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceRoleKey || "placeholder",
  {
    auth: {
      // Disable auto-refresh and session persistence — this is a server client
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
