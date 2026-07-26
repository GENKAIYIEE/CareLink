"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { getSession } from "@/lib/session";

// ─── Constants ────────────────────────────────────────────────────────────────
const BUCKET = "senior-photos"; // Public Supabase Storage bucket name
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Action: Upload profile photo (FormData) ──────────────────────────────────

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
  } catch (error: unknown) {
    console.error("[uploadPhotoAction] Unexpected error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to upload photo" };
  }
}

// ─── Action: Upload monthly picture (base64 from webcam) ─────────────────────
// Converts the webcam base64 data URL → Buffer → Supabase Storage.
// Returns a public URL so only the URL (not blob) is stored in the database.

export async function uploadMonthlyPictureToStorage(
  seniorId: string,
  base64DataUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Auth guard
    const session = await getSession();
    if (!session || session.role !== "SENIOR" || session.userId !== seniorId) {
      return { success: false, error: "Unauthorized." };
    }

    // Strip the "data:image/jpeg;base64," prefix
    const matches = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: "Invalid image format." };
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    if (!VALID_TYPES.includes(mimeType)) {
      return { success: false, error: "Invalid image type. Only JPG, PNG, and WEBP are allowed." };
    }

    // Decode base64 → Buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Size guard (2 MB)
    if (buffer.byteLength > MAX_SIZE) {
      return { success: false, error: "Image is too large. Maximum size is 2 MB." };
    }

    const ext = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
    const filename = `monthly-pictures/${seniorId}-${Date.now()}${ext}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true, // overwrite previous monthly picture for same senior
      });

    if (uploadError) {
      console.error("[uploadMonthlyPictureToStorage] Supabase error:", uploadError);
      return { success: false, error: "Failed to upload picture to storage." };
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from(BUCKET).getPublicUrl(filename);

    return { success: true, url: publicUrl };
  } catch (error: unknown) {
    console.error("[uploadMonthlyPictureToStorage] Unexpected error:", error);
    return { success: false, error: "Failed to upload picture. Please try again." };
  }
}
