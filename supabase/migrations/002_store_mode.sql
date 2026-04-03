-- ─────────────────────────────────────────
-- STORE PROFILES
-- Separate from customer auth.users profiles.
-- A store account is a Supabase Auth user with
-- a matching row in store_profiles.
-- ─────────────────────────────────────────
CREATE TABLE store_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name    text NOT NULL,
  store_number  text,                    -- e.g. "042" — NC ABC store number
  county        text,
  address       text,
  contact_name  text,
  contact_phone text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- RLS: store staff can only read/update their own profile
ALTER TABLE store_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_own_profile" ON store_profiles
  FOR ALL USING (auth.uid() = id);


-- ─────────────────────────────────────────
-- LOTTERY PROGRAMS
-- One row per lottery event a store creates.
-- ─────────────────────────────────────────
CREATE TABLE lottery_programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  bottle_name     text NOT NULL,          -- e.g. "Weller 12"
  description     text,                   -- optional flavor text for display
  bottle_count    int DEFAULT 1,          -- how many bottles available
  draw_date       timestamptz NOT NULL,
  draw_winner_count int DEFAULT 1,        -- usually = bottle_count
  status          text DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming', 'active', 'drawn', 'closed')),
  winner_user_ids uuid[],                 -- populated after draw
  notes           text,                   -- internal staff notes
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE lottery_programs ENABLE ROW LEVEL SECURITY;

-- Store staff can manage their own programs
CREATE POLICY "store_own_programs" ON lottery_programs
  FOR ALL USING (
    store_id = auth.uid()
  );

-- Customers can read active/drawn programs (for My Entries view)
CREATE POLICY "customers_read_programs" ON lottery_programs
  FOR SELECT USING (status IN ('active', 'drawn'));


-- ─────────────────────────────────────────
-- LOTTERY TOKENS
-- One row per QR code generated at the register.
-- Each token is single-use and expires in 15 minutes.
-- ─────────────────────────────────────────
CREATE TABLE lottery_tokens (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token               text UNIQUE NOT NULL,   -- 8-char URL-safe string
  program_id          uuid NOT NULL REFERENCES lottery_programs(id) ON DELETE CASCADE,
  store_id            uuid NOT NULL REFERENCES store_profiles(id),
  status              text DEFAULT 'pending'
                        CHECK (status IN ('pending', 'claimed', 'expired')),
  created_at          timestamptz DEFAULT now(),
  expires_at          timestamptz DEFAULT (now() + interval '15 minutes'),
  claimed_by_user_id  uuid REFERENCES auth.users(id),
  claimed_by_phone    text,        -- fallback if no Dram Scout account
  claimed_at          timestamptz,
  ticket_number       int          -- sequential within program, assigned on claim
);

ALTER TABLE lottery_tokens ENABLE ROW LEVEL SECURITY;

-- Store staff can generate and view their own tokens
CREATE POLICY "store_own_tokens" ON lottery_tokens
  FOR ALL USING (store_id = auth.uid());

-- Anyone can read a pending token by token string (for claim page validation)
-- This is handled via a Fastify API endpoint, NOT direct Supabase client access
-- Claim page calls the API, not Supabase directly, so no public RLS needed here.

-- Customers can read tokens they claimed (for My Entries)
CREATE POLICY "customer_claimed_tokens" ON lottery_tokens
  FOR SELECT USING (claimed_by_user_id = auth.uid());


-- ─────────────────────────────────────────
-- HELPER: auto-update updated_at on programs
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lottery_programs_updated_at
  BEFORE UPDATE ON lottery_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────
-- HELPER: sequential ticket numbers within program
-- Called from the claim API, not a trigger, to keep
-- the atomic claim logic in application code.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION next_ticket_number(p_program_id uuid)
RETURNS int AS $$
  SELECT COALESCE(MAX(ticket_number), 0) + 1
  FROM lottery_tokens
  WHERE program_id = p_program_id AND status = 'claimed';
$$ LANGUAGE sql;


-- ─────────────────────────────────────────
-- CLEANUP: mark expired pending tokens
-- Run this via pg_cron or call from API on a schedule
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_stale_tokens()
RETURNS void AS $$
  UPDATE lottery_tokens
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
$$ LANGUAGE sql;
