-- ─────────────────────────────────────────────────────────────────────────────
-- 016_barrel_pick_comments.sql
-- Adds community commenting on barrel picks.
--
-- Changes:
--   • store_profiles.comments_enabled (BOOLEAN DEFAULT TRUE) — global toggle
--     for a store to enable/disable comments on all their barrel picks.
--   • barrel_pick_comments table — modeled after sighting_comments, with RLS
--     policies that gate on is_published AND comments_enabled.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add global comments toggle to store_profiles (default ON)
ALTER TABLE store_profiles
  ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- ─────────────────────────────────────────
-- BARREL PICK COMMENTS
-- ─────────────────────────────────────────
CREATE TABLE barrel_pick_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id    UUID NOT NULL REFERENCES barrel_picks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle     TEXT NOT NULL,
  body       TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 1000),
  parent_id  UUID REFERENCES barrel_pick_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_barrel_pick_comments_pick_id ON barrel_pick_comments(pick_id, created_at ASC);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE barrel_pick_comments ENABLE ROW LEVEL SECURITY;

-- Public read: only when pick is published AND store has comments enabled
CREATE POLICY "pick_comments_public_read" ON barrel_pick_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barrel_picks bp
      JOIN store_profiles sp ON sp.id = bp.store_id
      WHERE bp.id = pick_id
        AND bp.is_published = TRUE
        AND sp.comments_enabled = TRUE
    )
  );

-- Authenticated users can insert (same gate as read)
CREATE POLICY "pick_comments_authenticated_insert" ON barrel_pick_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM barrel_picks bp
      JOIN store_profiles sp ON sp.id = bp.store_id
      WHERE bp.id = pick_id
        AND bp.is_published = TRUE
        AND sp.comments_enabled = TRUE
    )
  );

-- Users can delete their own comments
CREATE POLICY "pick_comments_user_delete" ON barrel_pick_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Store owner can delete any comment on their picks
CREATE POLICY "pick_comments_store_delete" ON barrel_pick_comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM barrel_picks bp
      WHERE bp.id = pick_id AND bp.store_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- GRANTS
-- ─────────────────────────────────────────
GRANT SELECT ON barrel_pick_comments TO anon;
GRANT SELECT, INSERT, DELETE ON barrel_pick_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON barrel_pick_comments TO service_role;
