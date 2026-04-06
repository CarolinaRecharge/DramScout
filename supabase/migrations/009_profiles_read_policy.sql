-- Allow any authenticated user to read profile rows.
-- This lets the store portal look up winner details (name, email, phone)
-- without requiring the service role key. The policy is read-only and
-- appropriate since stores legitimately need to contact lottery winners.
CREATE POLICY "authenticated_users_read_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
