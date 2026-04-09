-- ─────────────────────────────────────────────────────────────────────────────
-- 018_store_owner_comments_read.sql
-- Lets store owners read all comments on their own picks in the store preview,
-- regardless of is_published or comments_enabled status.
--
-- Supabase RLS permissive policies are OR-ed, so this adds to (not replaces)
-- the existing pick_comments_public_read policy.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "pick_comments_store_read" ON barrel_pick_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barrel_picks bp
      WHERE bp.id = pick_id AND bp.store_id = auth.uid()
    )
  );
