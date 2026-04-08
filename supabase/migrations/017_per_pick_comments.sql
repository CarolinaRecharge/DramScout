-- ─────────────────────────────────────────────────────────────────────────────
-- 017_per_pick_comments.sql
-- Moves the comments on/off toggle from the store level to the per-pick level.
--
-- Changes:
--   • barrel_picks.comments_enabled (BOOLEAN DEFAULT TRUE) — per-pick toggle.
--   • Drops the old RLS policies that gated on store_profiles.comments_enabled.
--   • Re-creates the public_read and authenticated_insert policies to gate on
--     barrel_picks.comments_enabled instead.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add per-pick comments toggle (default ON for all existing picks)
ALTER TABLE barrel_picks
  ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Drop old policies that join store_profiles for the comments gate
DROP POLICY IF EXISTS "pick_comments_public_read" ON barrel_pick_comments;
DROP POLICY IF EXISTS "pick_comments_authenticated_insert" ON barrel_pick_comments;

-- Re-create: gate only on per-pick flag (no store-level join needed)
CREATE POLICY "pick_comments_public_read" ON barrel_pick_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barrel_picks bp
      WHERE bp.id = pick_id
        AND bp.is_published = TRUE
        AND bp.comments_enabled = TRUE
    )
  );

CREATE POLICY "pick_comments_authenticated_insert" ON barrel_pick_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM barrel_picks bp
      WHERE bp.id = pick_id
        AND bp.is_published = TRUE
        AND bp.comments_enabled = TRUE
    )
  );
