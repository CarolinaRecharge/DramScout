-- ─────────────────────────────────────────────────────────────────────────────
-- 012_barrel_picks.sql
-- Barrel picks: hand-selected whiskey barrels posted by store staff,
-- browseable by customers in the Scout tab public feed.
--
-- Architecture notes (vs. original spec):
--   • barrel_picks.store_id REFERENCES store_profiles(id) — not stores(id) —
--     because store portal auth is store_profiles.id = auth.uid().
--   • RLS uses store_id = auth.uid() matching lottery_programs pattern.
--     No store_staff junction table needed.
--   • linked_store_id added to store_profiles so staff can link their portal
--     account to the public stores directory (lat/lng) for distance queries.
--
-- Storage bucket (manual Supabase dashboard step):
--   Bucket name: barrel-pick-photos
--   Public: true
--   Allowed types: image/jpeg, image/png, image/webp
--   Max size: 8MB
--   Path convention: {store_id}/{pick_id}/{uuid}.{ext}
-- ─────────────────────────────────────────────────────────────────────────────

-- Link store portal accounts to public store directory entries for lat/lng
ALTER TABLE store_profiles
  ADD COLUMN IF NOT EXISTS linked_store_id UUID REFERENCES stores(id) ON DELETE SET NULL;


-- ─────────────────────────────────────────
-- BARREL PICKS
-- ─────────────────────────────────────────
CREATE TABLE barrel_picks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Whiskey identity
  distillery          TEXT NOT NULL,
  brand               TEXT NOT NULL,
  expression          TEXT,               -- e.g. "Single Barrel Rye"
  barrel_number       TEXT,
  warehouse_rick      TEXT,               -- e.g. "Warehouse K, Rick 3"
  age_stated          INTEGER,            -- in years, null if NAS
  proof               NUMERIC(5,1) NOT NULL,
  vintage_year        INTEGER,            -- distillation year if known

  -- Store context
  label_name          TEXT,               -- store's custom label name if any
  selected_by         TEXT,               -- e.g. "Staff", "Bourbon Club", "Owner"
  selection_date      DATE,               -- when the store chose the barrel
  arrival_date        DATE,               -- when bottles hit shelves
  price_per_bottle    NUMERIC(8,2),
  bottles_total       INTEGER,
  bottles_remaining   INTEGER,
  msrp                NUMERIC(8,2),       -- for comparison display

  -- Content
  store_notes         TEXT,               -- store's narrative description
  tasting_notes       TEXT[] DEFAULT '{}', -- controlled vocabulary chips

  -- Status
  status              TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'low', 'sold_out', 'coming_soon')),
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,

  -- Photo references (Supabase Storage paths)
  photo_urls          TEXT[] DEFAULT '{}', -- ordered array, index 0 = hero image
  primary_photo_url   TEXT                -- denormalized for fast list queries
);

-- Indexes for store lookups and public feed
CREATE INDEX idx_barrel_picks_store_id    ON barrel_picks(store_id);
CREATE INDEX idx_barrel_picks_status      ON barrel_picks(status);
CREATE INDEX idx_barrel_picks_is_published ON barrel_picks(is_published);
CREATE INDEX idx_barrel_picks_created_at  ON barrel_picks(created_at DESC);
CREATE INDEX idx_barrel_picks_arrival_date ON barrel_picks(arrival_date DESC);

-- Updated_at trigger — reuse existing function from migration 002
CREATE TRIGGER barrel_picks_updated_at
  BEFORE UPDATE ON barrel_picks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────
-- BARREL PICK REPORTS
-- Community availability reports (crowdsourced confirmation)
-- ─────────────────────────────────────────
CREATE TABLE barrel_pick_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id     UUID NOT NULL REFERENCES barrel_picks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_type TEXT NOT NULL
    CHECK (report_type IN ('still_available', 'sold_out', 'low_stock')),
  UNIQUE(pick_id, user_id)  -- one report per user per pick
);

CREATE INDEX idx_barrel_pick_reports_pick_id ON barrel_pick_reports(pick_id);


-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE barrel_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE barrel_pick_reports ENABLE ROW LEVEL SECURITY;

-- Public can read published picks
CREATE POLICY "published picks are public"
  ON barrel_picks FOR SELECT
  USING (is_published = TRUE);

-- Store staff can read all their own store's picks (including drafts)
-- Uses store_id = auth.uid() matching the existing lottery_programs pattern
CREATE POLICY "store staff read own picks"
  ON barrel_picks FOR SELECT
  USING (store_id = auth.uid());

-- Store staff can insert/update/delete their own store's picks
CREATE POLICY "store staff manage own picks"
  ON barrel_picks FOR ALL
  USING (store_id = auth.uid());

-- Authenticated users can submit / update reports (upsert)
CREATE POLICY "users submit reports"
  ON barrel_pick_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own reports"
  ON barrel_pick_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "reports are public"
  ON barrel_pick_reports FOR SELECT
  USING (TRUE);


-- ─────────────────────────────────────────
-- STORAGE BUCKET POLICIES
-- Run after creating the barrel-pick-photos bucket in Supabase dashboard.
-- ─────────────────────────────────────────

-- Allow authenticated store staff to upload
CREATE POLICY "store staff upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'barrel-pick-photos'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update (replace) photos
CREATE POLICY "store staff update photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'barrel-pick-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access to all barrel pick photos
CREATE POLICY "photos are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barrel-pick-photos');

-- Store staff can delete their own photos
CREATE POLICY "store staff delete photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'barrel-pick-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
