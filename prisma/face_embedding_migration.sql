-- ============================================================
-- CareLink — Face Embedding Migration
-- Run this script in the Supabase SQL Editor ONCE.
-- Do NOT add face_embedding to prisma/schema.prisma —
-- the vector type is unsupported by Prisma.
-- ============================================================

-- 1. Enable the pgvector extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add the face_embedding column to the existing Senior table
--    IF NOT EXISTS prevents errors on re-runs.
ALTER TABLE "Senior"
  ADD COLUMN IF NOT EXISTS face_embedding vector(128);

-- 3. Create an IVFFlat index for fast approximate-nearest-neighbor searches.
--    Only useful once you have > ~1000 rows; harmless on smaller datasets.
CREATE INDEX IF NOT EXISTS senior_face_embedding_idx
  ON "Senior"
  USING ivfflat (face_embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Create (or replace) the match_face RPC function.
--    This is called from the client via supabase.rpc('match_face', {...}).
CREATE OR REPLACE FUNCTION match_face(
  query_embedding  vector(128),
  match_threshold  float,
  match_count      int
)
RETURNS TABLE (
  id          text,
  "oscaId"    text,
  "firstName" text,
  "lastName"  text,
  similarity  float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id::text,
    s."oscaId",
    s."firstName",
    s."lastName",
    (s.face_embedding <-> query_embedding) AS similarity
  FROM "Senior" s
  WHERE s.face_embedding IS NOT NULL
    AND (s.face_embedding <-> query_embedding) < match_threshold
  ORDER BY s.face_embedding <-> query_embedding
  LIMIT match_count;
END;
$$;
