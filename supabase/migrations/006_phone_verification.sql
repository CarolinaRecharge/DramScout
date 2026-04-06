-- Extend profiles table with phone fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Short-lived OTP codes for phone verification
CREATE TABLE IF NOT EXISTS phone_verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,
  code_hash     TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only service role accesses this table; no client-side RLS policies needed
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS phone_verifications_user_id_idx ON phone_verifications(user_id);
