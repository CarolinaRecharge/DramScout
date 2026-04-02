-- ============================================================
-- Migration 002: Auto-geocoding support for stores
--
-- What this does:
--   1. Adds a `geocoded_at` column so we can track which stores
--      have been verified against a geocoding service.
--   2. Adds a `needs_geocode` flag that the trigger sets to TRUE
--      on every INSERT (or on UPDATE when address/city/state changes).
--   3. Creates a `geocode_new_store()` function that calls the
--      `geocode-store` Edge Function via pg_net (available by default
--      in Supabase). The function fires asynchronously so the INSERT
--      completes instantly; the edge function updates lat/lng moments later.
--
-- Prerequisites:
--   • pg_net extension must be enabled (Supabase dashboard → Database → Extensions)
--   • SUPABASE_EDGE_FUNCTION_URL must be set as a db secret or replaced inline below
--   • Deploy the supabase/functions/geocode-store edge function first
--
-- Run this in the Supabase SQL Editor (or via supabase db push).
-- ============================================================


-- ── 1. Schema additions ───────────────────────────────────────────────────────

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS geocoded_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS needs_geocode BOOLEAN     NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS stores_needs_geocode_idx ON stores(needs_geocode) WHERE needs_geocode = TRUE;


-- ── 2. pg_net extension (enable if not already active) ────────────────────────
-- Uncomment if you haven't enabled it via the dashboard:
-- CREATE EXTENSION IF NOT EXISTS pg_net;


-- ── 3. Trigger function: fire edge function asynchronously ────────────────────
--
-- Replace <YOUR-PROJECT-REF> with your Supabase project reference slug,
-- e.g. 'abcdefghijklmnop' from https://app.supabase.com/project/<ref>.
--
-- The service-role key is passed so the edge function can write back to the DB.
-- Store it as a database secret (supabase secrets set ...) and reference it via
-- current_setting(), or hard-code for development only.

CREATE OR REPLACE FUNCTION geocode_new_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _edge_url   TEXT;
  _service_key TEXT;
  _payload    JSONB;
BEGIN
  -- Pull config from Supabase Vault secrets (set via `supabase secrets set`).
  -- Fallback: hard-code the URL for development.
  BEGIN
    _edge_url    := current_setting('app.edge_function_url');
  EXCEPTION WHEN OTHERS THEN
    -- Replace with your actual edge function URL:
    _edge_url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/geocode-store';
  END;

  BEGIN
    _service_key := current_setting('app.service_role_key');
  EXCEPTION WHEN OTHERS THEN
    _service_key := '';
  END;

  _payload := jsonb_build_object('store_id', NEW.id);

  -- Fire-and-forget via pg_net; does not block the INSERT.
  PERFORM net.http_post(
    url     := _edge_url,
    body    := _payload::TEXT,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _service_key
    )
  );

  -- Mark as pending geocode so we can query unprocessed stores easily.
  NEW.needs_geocode := TRUE;

  RETURN NEW;
END;
$$;


-- ── 4. Trigger: fires on INSERT, and on UPDATE when address fields change ─────

DROP TRIGGER IF EXISTS trg_geocode_on_insert  ON stores;
DROP TRIGGER IF EXISTS trg_geocode_on_address_change ON stores;

-- New store inserted → always geocode
CREATE TRIGGER trg_geocode_on_insert
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION geocode_new_store();

-- Existing store's address edited → re-geocode
CREATE TRIGGER trg_geocode_on_address_change
  BEFORE UPDATE OF address, city, state ON stores
  FOR EACH ROW
  WHEN (
    OLD.address IS DISTINCT FROM NEW.address OR
    OLD.city    IS DISTINCT FROM NEW.city    OR
    OLD.state   IS DISTINCT FROM NEW.state
  )
  EXECUTE FUNCTION geocode_new_store();


-- ── 5. Helper: manually queue specific stores for re-geocoding ────────────────
--
-- Usage:  SELECT queue_stores_for_geocoding();         -- all un-geocoded
--         SELECT queue_stores_for_geocoding('Wake');   -- specific county

CREATE OR REPLACE FUNCTION queue_stores_for_geocoding(p_county TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _count INTEGER;
BEGIN
  IF p_county IS NOT NULL THEN
    UPDATE stores
    SET needs_geocode = TRUE, geocoded_at = NULL
    WHERE county = p_county;
  ELSE
    UPDATE stores
    SET needs_geocode = TRUE, geocoded_at = NULL
    WHERE geocoded_at IS NULL;
  END IF;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;


-- ── 6. Convenience view: stores still awaiting geocoding ─────────────────────

CREATE OR REPLACE VIEW stores_pending_geocode AS
  SELECT id, name, address, city, state, county, lat, lng, created_at
  FROM   stores
  WHERE  geocoded_at IS NULL
  ORDER  BY created_at DESC;


-- ── Usage Notes ───────────────────────────────────────────────────────────────
--
-- After deploying:
--
-- 1. Run the one-time fix script to geocode all existing stores:
--      node scripts/geocode-stores.js --apply
--    Or trigger the edge function in batch mode:
--      curl -X POST https://<ref>.supabase.co/functions/v1/geocode-store \
--           -H "Authorization: Bearer <service-role-key>" \
--           -H "Content-Type: application/json" \
--           -d '{"all_ungeocoded": true}'
--
-- 2. New stores inserted into the `stores` table will automatically have
--    their coordinates verified/corrected within seconds of insertion.
--
-- 3. Check what's pending:
--      SELECT * FROM stores_pending_geocode;
--
-- 4. Force re-geocode a county (e.g. after bulk address corrections):
--      SELECT queue_stores_for_geocoding('Wake');
--    Then call the edge function with all_ungeocoded: true.
-- ============================================================
