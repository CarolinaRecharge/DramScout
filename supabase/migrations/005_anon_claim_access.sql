-- ─────────────────────────────────────────────────────────────────────────────
-- Allow anonymous (unauthenticated) users to validate and claim tokens.
-- The claim page is accessible without a Dram Scout account, so the API
-- must be able to read/update lottery_tokens without a service role key.
-- The token value itself (8 random base64url chars) acts as the auth secret.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table-level grants for the anon role (needed in addition to RLS policies)
GRANT SELECT ON lottery_tokens  TO anon;
GRANT UPDATE ON lottery_tokens  TO anon;
GRANT SELECT ON lottery_programs TO anon;
GRANT SELECT ON store_profiles   TO anon;

-- RPC grants — these functions are plain SQL so they run as the caller;
-- anon needs execute access.
GRANT EXECUTE ON FUNCTION next_ticket_number(uuid) TO anon;
GRANT EXECUTE ON FUNCTION expire_stale_tokens()    TO anon;

-- ── RLS: anon can read any token row ─────────────────────────────────────────
-- Tokens are 8-char random strings; guessing one is infeasible.
CREATE POLICY "anon_read_tokens"
ON lottery_tokens
FOR SELECT
TO anon
USING (true);

-- ── RLS: anon can claim a pending token ──────────────────────────────────────
-- USING: can only target rows that are still pending
-- WITH CHECK: can only set status to 'claimed' (not anything else)
CREATE POLICY "anon_claim_tokens"
ON lottery_tokens
FOR UPDATE
TO anon
USING  (status = 'pending')
WITH CHECK (status = 'claimed');

-- ── RLS: anon can read programs (needed for the JOIN in token validation) ─────
CREATE POLICY "anon_read_programs"
ON lottery_programs
FOR SELECT
TO anon
USING (true);

-- ── RLS: anon can read store profiles (needed for JOIN in token validation) ───
CREATE POLICY "anon_read_store_profiles"
ON store_profiles
FOR SELECT
TO anon
USING (true);
