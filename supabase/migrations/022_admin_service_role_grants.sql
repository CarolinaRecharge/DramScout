-- ─────────────────────────────────────────────────────────────────────────────
-- 022_admin_service_role_grants.sql
--
-- The service_role key bypasses RLS but still requires PostgreSQL object-level
-- GRANT to perform DML. Migration 004 only granted to `authenticated`.
-- The admin API (api/admin/store-accounts.js) uses the service_role client to
-- create and update store portal accounts, so it needs INSERT/UPDATE access.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON store_profiles TO service_role;
GRANT SELECT                         ON stores         TO service_role;
-- user_roles: needed so the admin API can seed the 'store' role on account creation
GRANT SELECT, INSERT, UPDATE         ON user_roles     TO service_role;
