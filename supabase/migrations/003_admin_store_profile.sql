-- Admin demo store profile
-- Uses auth.users to resolve the user ID from email, so this stays correct
-- even if the Supabase project is reset or the user re-registers.
-- Safe to re-run (ON CONFLICT upserts the key fields).

INSERT INTO store_profiles (
  id, store_name, store_number, county, address, contact_name, is_active
)
SELECT
  u.id,
  'Dram Scout HQ (Admin Demo)',
  '000',
  'Wake',
  'Admin Test Account — danielk.black95@gmail.com',
  'Daniel K.',
  true
FROM auth.users u
WHERE u.email = 'danielk.black95@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  store_name   = EXCLUDED.store_name,
  store_number = EXCLUDED.store_number,
  is_active    = true;
