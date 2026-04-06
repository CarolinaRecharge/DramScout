-- Grant service_role (used by Vercel API functions) read access to the tables
-- joined in the public barrel picks query: store_profiles and stores.
-- Without these, the barrel-picks GET returns "permission denied for table store_profiles".

GRANT SELECT ON TABLE store_profiles TO service_role;
GRANT SELECT ON TABLE stores        TO service_role;
