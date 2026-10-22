// src/lib/application-documents.ts
// Centralises document type definitions and file validation rules
// for the Online Application module.

export const DOCUMENT_TYPES = [
  {
    id: "proof_of_age",
    label: "Proof of Age",
    description: "PSA Birth Certificate or any government-issued ID showing date of birth",
    required: true,
  },
  {
    id: "proof_of_residency",
    label: "Proof of Residency",
    description: "Barangay Certificate of Residency or Indigency (issued within 6 months)",
    required: true,
  },
  {
    id: "valid_id",
    label: "Valid Government ID",
    description: "PHILSYS, Senior Citizen ID, Voter's ID, Passport, or Driver's License",
    required: true,
  },
  {
    id: "photo",
    label: "2x2 Photo",
    description: "Clear recent photo against a white or light background",
    required: true,
  },
] as const;

export type DocumentTypeId = (typeof DOCUMENT_TYPES)[number]["id"];

// Allowed MIME types by magic bytes (not just file.type from the browser)
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Size limits per document (bytes)
export const MAX_IMAGE_SIZE = 3 * 1024 * 1024;  // 3 MB — server actions cap is 4 MB
export const MAX_PDF_SIZE   = 2 * 1024 * 1024;  // 2 MB

// Supabase Storage bucket name (must be created as PRIVATE in the dashboard)
export const APP_DOC_BUCKET = "application-documents";

// ─── Magic-bytes check ────────────────────────────────────────────────────────
// Validates actual file content regardless of what the browser's File.type says.

export function detectMimeType(bytes: Uint8Array): AllowedMimeType | null {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  return null;
}

// ─── Reference code generator ─────────────────────────────────────────────────
// Format: APP-YYYY-XXXXXXXX  (8 random hex chars, uppercase)

export function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase().padStart(8, "0");
  return `APP-${year}-${rand}`;
}

// ─── Application status labels ────────────────────────────────────────────────

export const APPLICATION_STATUS: Record<string, { label: string; color: string }> = {
  Pending:       { label: "Pending Review",  color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  NeedsReupload: { label: "Needs Re-upload", color: "text-orange-700 bg-orange-50 border-orange-200" },
  Approved:      { label: "Approved",        color: "text-green-700  bg-green-50  border-green-200"  },
  Rejected:      { label: "Rejected",        color: "text-red-700    bg-red-50    border-red-200"    },
};
