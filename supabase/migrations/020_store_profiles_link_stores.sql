-- ─────────────────────────────────────────────────────────────────────────────
-- 020_store_profiles_link_stores.sql
--
-- Links store_profiles rows to real stores on the map (the `stores` table).
-- Requirements:
--   1. A portal account can only be created for a store that already exists
--      on the map (has a row in `stores`).
--   2. If a store's name is updated in `stores`, all linked store_profiles
--      rows have their store_name kept in sync automatically via a trigger.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add FK column linking a portal profile to its map store entry.
ALTER TABLE store_profiles
  ADD COLUMN IF NOT EXISTS stores_id uuid REFERENCES stores(id) ON DELETE SET NULL;

-- 2. Sync function: whenever stores.name changes, update store_name in all
--    linked store_profiles rows (both owner and sub-accounts share stores_id).
CREATE OR REPLACE FUNCTION sync_store_profile_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE store_profiles
       SET store_name = NEW.name
     WHERE stores_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_name_sync ON stores;
CREATE TRIGGER stores_name_sync
  AFTER UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION sync_store_profile_name();
