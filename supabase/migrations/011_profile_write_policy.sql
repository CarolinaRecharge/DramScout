-- Allow authenticated users to insert and update their own profile row.
-- This is needed so users can persist their custom scout handle (and any
-- future profile fields) from the client without requiring service-role access.
-- Safe to run even if the table has no RLS enabled — harmless extra policy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_manage_own_profile'
  ) THEN
    CREATE POLICY "users_manage_own_profile" ON profiles
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
