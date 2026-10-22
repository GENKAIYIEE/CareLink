-- ============================================================
-- CareLink — Online Application Module Migration
-- Run this script ONCE in the Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS / CREATE OR REPLACE.
-- Rollback: DROP TABLE IF EXISTS "ApplicationDocument"; DROP TABLE IF EXISTS "Application";
--           Then delete the "application-documents" bucket from Supabase Storage.
-- ============================================================

-- 1. Application table (parent)
CREATE TABLE IF NOT EXISTS "Application" (
  "id"                      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "referenceCode"           TEXT        NOT NULL UNIQUE,   -- e.g. APP-2026-A3B9F2C1
  "status"                  TEXT        NOT NULL DEFAULT 'Pending',
                                        -- Pending | NeedsReupload | Approved | Rejected

  -- Applicant personal details
  "firstName"               TEXT        NOT NULL,
  "middleName"              TEXT,
  "lastName"                TEXT        NOT NULL,
  "dateOfBirth"             TIMESTAMPTZ NOT NULL,
  "gender"                  TEXT        NOT NULL,
  "civilStatus"             TEXT        NOT NULL,
  "barangay"                TEXT        NOT NULL,
  "contactNumber"           TEXT        NOT NULL,
  "email"                   TEXT,

  -- Emergency contact
  "emergencyContactName"    TEXT        NOT NULL,
  "emergencyContactNum"     TEXT        NOT NULL,
  "emergencyContactRel"     TEXT        NOT NULL,

  -- Password chosen by the applicant (bcrypt hash). Copied to Senior on approval.
  "passwordHash"            TEXT        NOT NULL,

  -- Who submitted on behalf of the senior (optional)
  "submittedByName"         TEXT,
  "submittedByRelationship" TEXT,

  -- Review fields (filled by OSCA staff)
  "reviewNote"              TEXT,
  "reviewedById"            TEXT,       -- Admin.id — plain text so survives admin deletion
  "reviewedAt"              TIMESTAMPTZ,

  -- Set to Senior.id when the application is approved
  "seniorId"                TEXT        UNIQUE,

  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ApplicationDocument table (child, cascades on parent delete)
CREATE TABLE IF NOT EXISTS "ApplicationDocument" (
  "id"            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "applicationId" TEXT        NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,

  -- Document type identifier
  -- Values: "proof_of_age" | "proof_of_residency" | "valid_id" | "photo"
  "type"          TEXT        NOT NULL,

  -- Path within the private Supabase Storage bucket "application-documents"
  "storagePath"   TEXT        NOT NULL,
  "mimeType"      TEXT        NOT NULL,
  "sizeBytes"     INTEGER     NOT NULL,

  -- Per-document status
  "status"        TEXT        NOT NULL DEFAULT 'Submitted',
                              -- Submitted | Accepted | NeedsReupload
  "note"          TEXT,       -- Staff note when requesting a re-upload

  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each application can only have one document of each type at a time
  UNIQUE ("applicationId", "type")
);

-- 3. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS application_status_created_idx
  ON "Application" ("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS application_barangay_idx
  ON "Application" ("barangay");

CREATE INDEX IF NOT EXISTS application_name_idx
  ON "Application" ("lastName", "firstName");

CREATE INDEX IF NOT EXISTS appdoc_application_idx
  ON "ApplicationDocument" ("applicationId");

-- 4. Auto-update updatedAt trigger
CREATE OR REPLACE FUNCTION update_application_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS application_updated_at_trigger ON "Application";
CREATE TRIGGER application_updated_at_trigger
  BEFORE UPDATE ON "Application"
  FOR EACH ROW EXECUTE FUNCTION update_application_updated_at();

-- ============================================================
-- IMPORTANT: After running this SQL, create a NEW private
-- Supabase Storage bucket named exactly:
--   application-documents
-- Set it to PRIVATE (not public). Staff will access documents
-- via short-lived signed URLs generated server-side.
-- ============================================================
