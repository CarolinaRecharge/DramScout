-- Grant table-level permissions for store mode tables.
-- Supabase auto-grants these for tables created via the dashboard,
-- but tables created via raw SQL migrations need explicit grants.
-- RLS policies handle row-level filtering; these grants allow the
-- authenticated role to reach the tables at all.

GRANT SELECT, INSERT, UPDATE ON store_profiles  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lottery_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lottery_tokens  TO authenticated;
