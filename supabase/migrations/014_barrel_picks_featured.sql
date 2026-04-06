-- Add is_featured flag to barrel_picks.
-- Featured picks always appear in the public feed regardless of the user's location.
-- Use this for admin/demo picks or store picks you want to promote globally.

ALTER TABLE barrel_picks
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
