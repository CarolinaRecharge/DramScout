-- Add user-defined favorite filter keywords to profiles.
-- Stores an ordered array of label/brand strings the user has pinned
-- to their Scout-tab filter strip.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS favorite_filters text[] NOT NULL DEFAULT '{}';
