"use server";

import { supabaseServer } from "@/lib/supabase-server";

// ─── Constants ────────────────────────────────────────────────────────────────
const BUCKET = "senior-photos"; // Public Supabase Storage bucket name
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Action ───────────────────────────────────────────────────────────────────

export async function uploadPhotoAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.size > MAX_SIZE) {
      return { success: false, error: "File exceeds 2MB limit" };
    }

    if (!VALID_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPG, PNG, and WEBP are allowed.",
      };
    }

    // Build a unique, safe filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
    const filename = `photo-${uniqueSuffix}${ext}`;

    // Convert File → ArrayBuffer → Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage ───────────────────────────────────────────────
    // Uses the service-role key so it bypasses Row Level Security policies.
    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET)
      .upload(filename, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadPhotoAction] Supabase upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get the public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabaseServer.storage.from(BUCKET).getPublicUrl(filename);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("[uploadPhotoAction] Unexpected error:", error);
    return { success: false, error: "Failed to upload photo" };
  }
}
