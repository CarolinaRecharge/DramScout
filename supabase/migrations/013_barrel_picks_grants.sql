-- Grant table-level permissions for barrel picks tables.
-- Tables created via raw SQL migrations need explicit grants —
-- Supabase only auto-grants all four roles for tables created in the dashboard.
-- RLS policies (in 012) handle row-level filtering on top of these grants.
--
-- Run this in Supabase SQL editor after 012_barrel_picks.sql.
-- All four roles are required: postgres (owner), anon (public reads),
-- authenticated (logged-in users), service_role (Vercel API functions).

GRANT ALL ON TABLE barrel_picks        TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE barrel_pick_reports TO postgres, anon, authenticated, service_role;
