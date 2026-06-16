"use server";

import fs from "fs/promises";
import path from "path";

export async function uploadPhotoAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "File exceeds 2MB limit" };
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Only JPG, PNG, and WEBP are allowed." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a safe, unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.name) || ".jpg";
    const filename = `photo-${uniqueSuffix}${ext}`;
    
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filepath = path.join(uploadDir, filename);
    
    // Ensure the directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    await fs.writeFile(filepath, buffer);

    return { success: true, url: `/uploads/${filename}` };
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return { success: false, error: "Failed to upload photo" };
  }
}
