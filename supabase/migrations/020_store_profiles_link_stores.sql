-- ─────────────────────────────────────────────────────────────────────────────
-- 020_store_profiles_link_stores.sql
--
-- Links store_profiles rows to real stores on the map (the `stores` table)
-- using the existing linked_store_id column (added in migration 012).
--
-- If a store's name is updated in `stores`, all linked store_profiles rows
-- have their store_name kept in sync automatically via a trigger.
--
-- NOTE: store_profiles already has linked_store_id UUID REFERENCES stores(id)
-- from migration 012. We must NOT add another FK to stores — PostgREST errors
-- when two FKs exist between the same pair of tables ("more than one
-- relationship found"). The trigger below uses linked_store_id as the join key.
-- ─────────────────────────────────────────────────────────────────────────────

-- Sync function: keep store_name up to date whenever stores.name changes.
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
