-- Add user-editable handle to profiles
-- This handle is used when posting sightings, comments, and forum posts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS handle TEXT;
