-- Store a point-in-time snapshot of draw winners (name, email, phone, ticket)
-- so the store portal can display past winners persistently without re-joining
-- profiles (which may have changed or been deleted since the draw).
ALTER TABLE lottery_programs
  ADD COLUMN IF NOT EXISTS winner_snapshot JSONB;
