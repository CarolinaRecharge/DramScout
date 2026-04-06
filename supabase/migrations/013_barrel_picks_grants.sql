-- Grant table-level permissions for barrel picks tables.
-- Tables created via raw SQL migrations need explicit grants —
-- Supabase only auto-grants for tables created in the dashboard.
-- RLS policies (in 012) handle row-level filtering; these grants
-- allow the anon and authenticated roles to reach the tables at all.
--
-- Run this in Supabase SQL editor after 012_barrel_picks.sql.

GRANT SELECT                       ON barrel_picks        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON barrel_picks      TO authenticated;

GRANT SELECT                       ON barrel_pick_reports TO anon;
GRANT SELECT, INSERT, UPDATE       ON barrel_pick_reports TO authenticated;
