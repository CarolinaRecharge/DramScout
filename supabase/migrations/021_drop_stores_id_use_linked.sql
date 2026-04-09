-- ─────────────────────────────────────────────────────────────────────────────
-- 021_drop_stores_id_use_linked.sql
--
-- Migration 020 added stores_id to store_profiles, but migration 012 already
-- added linked_store_id for the same purpose (linking a portal account to the
-- public stores map). Two FKs from store_profiles → stores causes PostgREST to
-- error ("more than one relationship found") on barrel picks embed queries.
--
-- Fix: drop the duplicate stores_id column and move all logic to linked_store_id.
-- The name-sync trigger is also corrected to join on linked_store_id.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop the duplicate FK column added in migration 020
ALTER TABLE store_profiles DROP COLUMN IF EXISTS stores_id;

-- 2. Correct the sync trigger to use linked_store_id (the canonical FK)
CREATE OR REPLACE FUNCTION sync_store_profile_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE store_profiles
       SET store_name = NEW.name
     WHERE linked_store_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_name_sync ON stores;
CREATE TRIGGER stores_name_sync
  AFTER UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION sync_store_profile_name();
