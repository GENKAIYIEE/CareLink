-- ============================================================
-- CareLink — Delegate Request Module Migration
-- Safe to re-run: uses IF NOT EXISTS
-- Rollback: DROP TABLE IF EXISTS "DelegateRequest";
-- ============================================================

CREATE TABLE IF NOT EXISTS "DelegateRequest" (
  "id"            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "seniorId"      TEXT        NOT NULL REFERENCES "Senior"("id") ON DELETE CASCADE,
  "fullName"      TEXT        NOT NULL,
  "relationship"  TEXT        NOT NULL,
  "contactNumber" TEXT        NOT NULL,
  "documentUrl"   TEXT,
  "status"        TEXT        NOT NULL DEFAULT 'Pending',
  "reviewNote"    TEXT,
  "reviewedById"  TEXT,
  "reviewedAt"    TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delegate_request_senior_status_idx
  ON "DelegateRequest" ("seniorId", "status");

CREATE INDEX IF NOT EXISTS delegate_request_status_created_idx
  ON "DelegateRequest" ("status", "createdAt" DESC);
