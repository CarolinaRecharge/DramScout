-- Dram Scout: Initial Schema
-- Run this entire block in the Supabase SQL Editor

-- TABLES

CREATE TABLE IF NOT EXISTS stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'NC',
  county      TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sightings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID REFERENCES stores(id) ON DELETE SET NULL,
  store_name         TEXT NOT NULL,
  city               TEXT NOT NULL,
  state              TEXT NOT NULL DEFAULT 'NC',
  lat                DOUBLE PRECISION NOT NULL,
  lng                DOUBLE PRECISION NOT NULL,
  bottles            TEXT[] NOT NULL,
  reporter           TEXT NOT NULL DEFAULT 'anonymous',
  notes              TEXT,
  confirmation_count INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS confirmations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES sightings(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sighting_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  store_id       UUID REFERENCES stores(id) ON DELETE SET NULL,
  store_name     TEXT NOT NULL,
  city           TEXT NOT NULL,
  state          TEXT NOT NULL DEFAULT 'NC',
  event_date     TIMESTAMPTZ NOT NULL,
  bottles        TEXT[] NOT NULL,
  expected_units TEXT,
  rules          JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, fingerprint)
);

-- INDEXES

CREATE INDEX IF NOT EXISTS stores_city_idx         ON stores(city);
CREATE INDEX IF NOT EXISTS stores_county_idx        ON stores(county);
CREATE INDEX IF NOT EXISTS stores_location_idx      ON stores(lat, lng);
CREATE INDEX IF NOT EXISTS sightings_created_at_idx ON sightings(created_at DESC);
CREATE INDEX IF NOT EXISTS sightings_store_id_idx   ON sightings(store_id);
CREATE INDEX IF NOT EXISTS confirmations_sighting_idx ON confirmations(sighting_id);
CREATE INDEX IF NOT EXISTS event_rsvps_event_idx    ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS events_date_idx          ON events(event_date DESC);

-- FUNCTIONS

CREATE OR REPLACE FUNCTION increment_confirmation(p_sighting_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sightings
  SET confirmation_count = confirmation_count + 1
  WHERE id = p_sighting_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_event_attendees(p_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER FROM event_rsvps WHERE event_id = p_event_id;
$$;

-- ROW LEVEL SECURITY

ALTER TABLE stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sightings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps   ENABLE ROW LEVEL SECURITY;

-- Drop policies first so this script is safe to re-run

DROP POLICY IF EXISTS "stores_select"         ON stores;
DROP POLICY IF EXISTS "sightings_select"      ON sightings;
DROP POLICY IF EXISTS "sightings_insert"      ON sightings;
DROP POLICY IF EXISTS "confirmations_select"  ON confirmations;
DROP POLICY IF EXISTS "confirmations_insert"  ON confirmations;
DROP POLICY IF EXISTS "events_select"         ON events;
DROP POLICY IF EXISTS "event_rsvps_select"    ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_insert"    ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_delete"    ON event_rsvps;

CREATE POLICY "stores_select"        ON stores        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sightings_select"     ON sightings     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sightings_insert"     ON sightings     FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "confirmations_select" ON confirmations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "confirmations_insert" ON confirmations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "events_select"        ON events        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "event_rsvps_select"   ON event_rsvps  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "event_rsvps_insert"   ON event_rsvps  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "event_rsvps_delete"   ON event_rsvps  FOR DELETE TO anon, authenticated USING (true);
