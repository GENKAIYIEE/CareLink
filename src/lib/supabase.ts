// src/lib/supabase.ts
// Browser-safe Supabase client for face embedding operations.
// All face_embedding reads/writes bypass Prisma and go through this client.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // Only warn – do not throw, so the app still boots even without face recognition.
  console.warn(
    "[CareLink] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
      "Face recognition features will be disabled."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
