-- ─────────────────────────────────────────────────────────────────────────────
-- 019_store_accounts.sql
-- Multi-account support per store with role-based permissions.
--
-- Each store can now have multiple auth users linked to it:
--   - owner / manager : full store portal access
--   - cashier         : generate tokens + view lotteries (no activate / re-draw)
--
-- The store entity stays in store_profiles.  Sub-accounts point back to the
-- owner row via parent_store_id.  A helper function (get_effective_store_id)
-- resolves the "real" store for RLS on lottery_programs and lottery_tokens.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend store_profiles with role + parent link
ALTER TABLE store_profiles
  ADD COLUMN IF NOT EXISTS store_role      text DEFAULT 'owner'
    CHECK (store_role IN ('owner', 'manager', 'cashier')),
  ADD COLUMN IF NOT EXISTS parent_store_id uuid
    REFERENCES store_profiles(id) ON DELETE CASCADE;

-- 2. Helper: return the effective store UUID for the current auth session.
--    Owner accounts  → their own id
--    Sub-accounts    → their parent's id
CREATE OR REPLACE FUNCTION get_effective_store_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT parent_store_id
       FROM store_profiles
      WHERE id = auth.uid()
        AND parent_store_id IS NOT NULL),
    auth.uid()
  );
$$;

-- 3. Update lottery_programs RLS so sub-accounts can see their store's programs
DROP POLICY IF EXISTS "store_own_programs" ON lottery_programs;
CREATE POLICY "store_own_programs" ON lottery_programs
  FOR ALL USING (store_id = get_effective_store_id());

-- 4. Update lottery_tokens RLS so sub-accounts can see / insert their store's tokens
DROP POLICY IF EXISTS "store_own_tokens" ON lottery_tokens;
CREATE POLICY "store_own_tokens" ON lottery_tokens
  FOR ALL USING (store_id = get_effective_store_id());

-- 5. Allow barrel_picks (if that table exists) to be visible to sub-accounts.
--    barrel_picks uses store_id = auth.uid(); update if the table is present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name   = 'barrel_picks'
  ) THEN
    -- Drop the existing store-ownership policy and recreate it with effective id.
    EXECUTE $policy$
      DROP POLICY IF EXISTS "store_own_barrel_picks" ON barrel_picks;
      CREATE POLICY "store_own_barrel_picks" ON barrel_picks
        FOR ALL USING (store_id = get_effective_store_id());
    $policy$;
  END IF;
END $$;
