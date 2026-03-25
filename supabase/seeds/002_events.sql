-- ============================================================
-- Dram Scout — Events Seed Data
-- Uses NOW() offsets so events are always relative to current date
-- ============================================================

INSERT INTO events (name, store_name, city, state, event_date, bottles, expected_units, rules, store_id)
SELECT
  name, store_name, city, state, event_date, bottles, expected_units, rules,
  (SELECT id FROM stores WHERE stores.name = events_data.store_name LIMIT 1) AS store_id
FROM (VALUES

  (
    'Blanton''s Allocation Drop',
    'Sandy Forks ABC #01',
    'Raleigh', 'NC',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    ARRAY['Blanton''s Original', 'Blanton''s Gold']::TEXT[],
    '~24 bottles total',
    '{"parking": "Street parking on Sandy Forks Rd. Store lot is first-come, do not block fire lane.", "overnight": "No overnight. Line forms at 7:00 AM day-of. Wristbands distributed at 8:45 AM.", "limit": "1 bottle per customer. ABC policy enforced — no exceptions.", "id": "Valid government-issued ID required. Must be 21+.", "notes": "Manager confirmed shipment arriving Tuesday evening. Drop expected to proceed as scheduled. No rainchecks if sold out."}'::JSONB
  ),
  (
    'Weller Wednesday Drop',
    'Village District ABC #08',
    'Raleigh', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '10 hours',
    ARRAY['Weller Special Reserve', 'Weller 12yr', 'Weller Full Proof']::TEXT[],
    '~36 bottles across all three expressions',
    '{"parking": "Garage parking available at Village District — first 2 hrs free.", "overnight": "No camping. Line begins at 8:30 AM. Staff will not acknowledge a line before that time.", "limit": "1 bottle per person per expression. Max 2 Weller labels per customer.", "id": "Valid ID required. One ID = one person = one purchase slot.", "notes": "High demand expected. Lottery system may be used at manager discretion if line exceeds 40 people at open."}'::JSONB
  ),
  (
    'Eagle Rare Saturday Release',
    'North Hills ABC #12',
    'Raleigh', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '3 days' + INTERVAL '8 hours' + INTERVAL '30 minutes',
    ARRAY['Eagle Rare 10yr']::TEXT[],
    '~18 bottles',
    '{"parking": "North Hills mall lot. Do not park in handicap spaces. Overflow on Lassiter Mill Rd.", "overnight": "No overnight queuing permitted by mall security. Line begins at 7:00 AM.", "limit": "1 bottle per customer. Photo ID matched to purchase.", "id": "Must present ID at time of purchase. Proxy buying not permitted.", "notes": "Community tip: The store opens the side entrance on weekends — line up at the right side door, not the main entrance."}'::JSONB
  ),
  (
    'Four Roses LE & SiB Release',
    'Cary Crossroads ABC',
    'Cary', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '8 days' + INTERVAL '9 hours',
    ARRAY['Four Roses Limited Edition', 'Four Roses Single Barrel']::TEXT[],
    '~12 LE + ~20 SiB',
    '{"parking": "Cary Crossroads shopping center lot. Ample parking, no issues typically.", "overnight": "No overnight. Manager starts list at 8:00 AM — must be present to add name. List closes at 8:55 AM.", "limit": "1 LE per customer, 1 SiB per customer. Separate transactions required.", "id": "Government-issued ID. Name on list must match ID exactly.", "notes": "This store uses a written name list rather than a physical line — highly recommended to arrive early to sign it. Releases tend to go smoothly here."}'::JSONB
  ),
  (
    'E.H. Taylor Barrel Proof Drop',
    'Morrisville Pkwy ABC',
    'Morrisville', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '14 days' + INTERVAL '9 hours',
    ARRAY['E.H. Taylor Barrel Proof', 'E.H. Taylor Small Batch']::TEXT[],
    'Unknown — single case confirmed',
    '{"parking": "Store strip mall lot. Shared with nail salon — be courteous.", "overnight": "No overnight. Line at 7:30 AM. Manager will not open early.", "limit": "1 bottle total per customer across both expressions.", "id": "ID required. Under no circumstances will staff hold bottles.", "notes": "Small allocation — likely 6-12 bottles combined. Expect a short but serious line. Store has been known to call the police if disputes arise."}'::JSONB
  ),
  (
    'Blanton''s Straight From the Barrel',
    'Brier Creek ABC #06',
    'Raleigh', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '6 days' + INTERVAL '9 hours',
    ARRAY['Blanton''s Straight from the Barrel']::TEXT[],
    '~8 bottles',
    '{"parking": "Brier Creek Commons lot — wide open, no issues.", "overnight": "No overnight. Line forms at 7:30 AM. Manager runs a first-come number system.", "limit": "1 bottle per customer, strictly enforced.", "id": "Valid ID required. No exceptions.", "notes": "SFТB is rare at this store. Community report says these were sitting in back stock for a few months — expect the regular Brier Creek crowd plus bourbon tourists."}'::JSONB
  ),
  (
    'Buffalo Trace Friday Restock',
    'Durham Central ABC',
    'Durham', 'NC',
    DATE_TRUNC('day', NOW()) - INTERVAL '2 days' + INTERVAL '9 hours',
    ARRAY['Buffalo Trace']::TEXT[],
    '~48 bottles',
    '{"parking": "Street parking on Foster St. Metered — bring quarters or use ParkMobile.", "overnight": "N/A — this was a standard shelf restock, no formal event.", "limit": "2 bottles per customer.", "id": "ID required at checkout.", "notes": "PAST EVENT — sold out by 9:45 AM. Line formed organically starting around 8:15 AM. Durham Central tends to restock BT quarterly."}'::JSONB
  ),
  (
    'Weller Antique 107 Lottery',
    'Durham ABC Chapel Hill Blvd',
    'Durham', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '21 days' + INTERVAL '9 hours',
    ARRAY['Weller Antique 107', 'Weller CYPB']::TEXT[],
    'Lottery — max 50 entries',
    '{"parking": "Shopping center lot with plenty of space.", "overnight": "N/A — lottery system. Enter online via Durham ABC website up to 48 hrs before.", "limit": "1 bottle per household. Winners selected randomly.", "id": "Winner must present matching ID at pickup window.", "notes": "Durham County ABC uses a digital lottery for high-demand releases. Check the Durham ABC website for the entry form. Results announced the day before."}'::JSONB
  ),
  (
    'Knob Creek 18yr & Parker''s Heritage',
    'Garner ABC #18',
    'Garner', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '4 days' + INTERVAL '10 hours',
    ARRAY['Knob Creek 18yr', 'Parker''s Heritage Collection']::TEXT[],
    '~6 Knob Creek + ~4 Parker''s',
    '{"parking": "New Rand Rd lot — easy in/out.", "overnight": "No overnight. Line at 8:00 AM sharp.", "limit": "1 bottle total per person (choose one label).", "id": "ID required.", "notes": "Very small release. Manager confirmed exactly 10 bottles total. Community expects a line of 20+ people for 10 bottles."}'::JSONB
  ),
  (
    'George T. Stagg Drop',
    'Wake Forest ABC #01',
    'Wake Forest', 'NC',
    DATE_TRUNC('day', NOW()) + INTERVAL '18 days' + INTERVAL '9 hours',
    ARRAY['George T. Stagg', 'William Larue Weller']::TEXT[],
    '~4 Stagg + ~3 WLW',
    '{"parking": "Downtown Wake Forest — street parking on E Holding Ave.", "overnight": "No overnight. This is a high-stakes drop — expect police presence at manager request.", "limit": "1 bottle per customer, enforced by video review. No sharing households.", "id": "ID required, logged at sale.", "notes": "BTAC season. Wake Forest #01 has received BTAC the past 3 years. Community intel says 7 total bottles confirmed. Arrive very early."}'::JSONB
  )

) AS events_data(name, store_name, city, state, event_date, bottles, expected_units, rules);
