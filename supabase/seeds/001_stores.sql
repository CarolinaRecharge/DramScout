-- ============================================================
-- Dram Scout — NC ABC Store Seed Data
-- ~110 real NC ABC store locations with approximate coordinates
-- Coordinates sourced from address geocoding — verify and update
-- any that appear off using the Supabase table editor.
-- ============================================================

INSERT INTO stores (name, address, city, state, county, lat, lng) VALUES

-- ── WAKE COUNTY — RALEIGH ────────────────────────────────────────────────
('Sandy Forks ABC #01',       '7112 Sandy Forks Rd',      'Raleigh',          'NC', 'Wake',         35.8691,  -78.6282),
('Brier Creek ABC #06',       '6809 Davis Cir',            'Raleigh',          'NC', 'Wake',         35.8882,  -78.7110),
('Village District ABC #08',  '420 Woodburn Rd',           'Raleigh',          'NC', 'Wake',         35.8055,  -78.6620),
('North Hills ABC #12',       '3320 Olympia Dr',           'Raleigh',          'NC', 'Wake',         35.8509,  -78.6438),
('Creedmoor ABC #20',         '7336 Creedmoor Rd',         'Raleigh',          'NC', 'Wake',         35.9003,  -78.7005),
('Avent Ferry ABC #25',       '2109 Avent Ferry Rd',       'Raleigh',          'NC', 'Wake',         35.7750,  -78.6830),
('Strickland ABC',            '9525 Strickland Rd',        'Raleigh',          'NC', 'Wake',         35.9185,  -78.6935),
('Appliance Court ABC',       '2649 Appliance Ct',         'Raleigh',          'NC', 'Wake',         35.8268,  -78.5638),
('Downtown Raleigh ABC',      '209 S Salisbury St',        'Raleigh',          'NC', 'Wake',         35.7765,  -78.6390),
('Glenwood Ave ABC',          '6181 Glenwood Ave',         'Raleigh',          'NC', 'Wake',         35.8888,  -78.7410),
('Spring Forest ABC',         '1401 Spring Forest Rd',     'Raleigh',          'NC', 'Wake',         35.8680,  -78.6495),
('Falls of Neuse ABC',        '11600 Falls of Neuse Rd',   'Raleigh',          'NC', 'Wake',         35.9048,  -78.5980),
('Capital Blvd ABC',          '2409 Capital Blvd',         'Raleigh',          'NC', 'Wake',         35.8340,  -78.6033),
('Western Blvd ABC',          '1130 Western Blvd',         'Raleigh',          'NC', 'Wake',         35.7775,  -78.6665),
('New Bern Ave ABC',          '4020 New Bern Ave',         'Raleigh',          'NC', 'Wake',         35.8105,  -78.5870),

-- ── WAKE COUNTY — CARY ──────────────────────────────────────────────────
('Cary Crossroads ABC',       '3615 SW Cary Pkwy',         'Cary',             'NC', 'Wake',         35.7913,  -78.7893),
('Cary Towne ABC',            '665 Cary Towne Blvd',       'Cary',             'NC', 'Wake',         35.7717,  -78.7590),
('Wellington Park ABC',       '6494 Tryon Rd',             'Cary',             'NC', 'Wake',         35.7545,  -78.7860),
('Cary Parkway ABC',          '1135 Cary Pkwy',            'Cary',             'NC', 'Wake',         35.7910,  -78.7680),

-- ── WAKE COUNTY — OTHER CITIES ──────────────────────────────────────────
('Apex ABC',                  '1793 W Williams St',        'Apex',             'NC', 'Wake',         35.7321,  -78.8503),
('Apex Beaver Creek ABC',     '1120 W Williams St',        'Apex',             'NC', 'Wake',         35.7398,  -78.8420),
('Holly Springs ABC #24',     '100 Village Walk Dr',       'Holly Springs',    'NC', 'Wake',         35.6513,  -78.8340),
('Holly Springs ABC #32',     '200 Ballentine St',         'Holly Springs',    'NC', 'Wake',         35.6425,  -78.8508),
('Garner ABC #18',            '200 New Rand Rd',           'Garner',           'NC', 'Wake',         35.7095,  -78.6145),
('Garner Timber Dr ABC',      '301 Timber Dr',             'Garner',           'NC', 'Wake',         35.6985,  -78.6450),
('Wake Forest ABC #01',       '350 E Holding Ave',         'Wake Forest',      'NC', 'Wake',         35.9743,  -78.5105),
('Wake Forest ABC #03',       '11360 Capital Blvd',        'Wake Forest',      'NC', 'Wake',         35.9960,  -78.5492),
('Morrisville Pkwy ABC',      '4009 Davis Dr',             'Morrisville',      'NC', 'Wake',         35.8312,  -78.8235),
('Fuquay-Varina ABC #13',     '1940 Cinema Dr',            'Fuquay-Varina',    'NC', 'Wake',         35.5830,  -78.7982),
('Fuquay-Varina ABC #22',     '700 N Main St',             'Fuquay-Varina',    'NC', 'Wake',         35.5985,  -78.7995),
('Knightdale ABC',            '1240 Hinton Oaks Blvd',     'Knightdale',       'NC', 'Wake',         35.7872,  -78.4850),
('Zebulon ABC',               '309 N Arendell Ave',        'Zebulon',          'NC', 'Wake',         35.8255,  -78.3145),
('Wendell ABC',               '138 S Main St',             'Wendell',          'NC', 'Wake',         35.7795,  -78.3685),

-- ── JOHNSTON COUNTY ──────────────────────────────────────────────────────
('Clayton ABC',               '750 US-70 BUS W',           'Clayton',          'NC', 'Johnston',     35.6493,  -78.4569),
('Smithfield ABC',            '1001 N Bright Leaf Blvd',   'Smithfield',       'NC', 'Johnston',     35.5108,  -78.3432),
('Selma ABC',                 '214 N Pollock St',          'Selma',            'NC', 'Johnston',     35.5365,  -78.2843),

-- ── DURHAM COUNTY ────────────────────────────────────────────────────────
('Durham ABC Holloway',       '1928 Holloway St',          'Durham',           'NC', 'Durham',       35.9773,  -78.8773),
('Durham ABC Hillsborough',   '2806 Hillsborough Rd',      'Durham',           'NC', 'Durham',       36.0175,  -78.9760),
('Durham ABC Chapel Hill Blvd','3620 Chapel Hill Blvd',    'Durham',           'NC', 'Durham',       35.9978,  -78.9608),
('Durham ABC N Roxboro',      '5122 N Roxboro St',         'Durham',           'NC', 'Durham',       36.0535,  -78.8695),
('Durham Central ABC',        '831 N Mangum St',           'Durham',           'NC', 'Durham',       35.9962,  -78.8980),
('South Square ABC',          '3722 S Miami Blvd',         'Durham',           'NC', 'Durham',       35.9712,  -78.8670),
('Fayetteville Rd ABC',       '4600 Fayetteville Rd',      'Durham',           'NC', 'Durham',       35.9595,  -78.9178),
('Westover Hills ABC',        '5512 S Miami Blvd',         'Durham',           'NC', 'Durham',       35.9545,  -78.8640),
('Guess Rd ABC',              '2500 Guess Rd',             'Durham',           'NC', 'Durham',       36.0340,  -78.8978),

-- ── ORANGE COUNTY ────────────────────────────────────────────────────────
('Chapel Hill ABC South',     '40120 Moring Dr',           'Chapel Hill',      'NC', 'Orange',       35.8660,  -79.0580),
('Meadowmont ABC',            '609 Meadowmont Village Cir','Chapel Hill',      'NC', 'Orange',       35.9225,  -78.9842),
('Perkins Dr ABC',            '251 Perkins Dr',            'Chapel Hill',      'NC', 'Orange',       35.9330,  -79.0280),
('Southern Village ABC',      '300 Market St',             'Chapel Hill',      'NC', 'Orange',       35.8744,  -79.0521),
('Carrboro ABC',              '106 NC-54',                 'Carrboro',         'NC', 'Orange',       35.9101,  -79.0814),

-- ── MECKLENBURG COUNTY — CHARLOTTE ──────────────────────────────────────
('Charlotte ABC Cherry St',   '125 Cherry St',             'Charlotte',        'NC', 'Mecklenburg',  35.2255,  -80.8285),
('Charlotte ABC Albemarle',   '6400 Albemarle Rd',         'Charlotte',        'NC', 'Mecklenburg',  35.2140,  -80.7330),
('Charlotte ABC S Tryon',     '8130 S Tryon St',           'Charlotte',        'NC', 'Mecklenburg',  35.1020,  -80.9015),
('Charlotte ABC Sunset',      '4315 Sunset Rd',            'Charlotte',        'NC', 'Mecklenburg',  35.2738,  -80.8895),
('Charlotte ABC University',  '9740 University City Blvd', 'Charlotte',        'NC', 'Mecklenburg',  35.3095,  -80.7280),
('Charlotte ABC Prosperity',  '5715 Prosperity Church Rd', 'Charlotte',        'NC', 'Mecklenburg',  35.3360,  -80.7985),
('Charlotte ABC N Tryon',     '4706 N Tryon St',           'Charlotte',        'NC', 'Mecklenburg',  35.2758,  -80.8012),
('Charlotte ABC Steele Creek','8600 Steele Creek Rd',      'Charlotte',        'NC', 'Mecklenburg',  35.1155,  -80.9100),
('Matthews ABC',              '10305 E Independence Blvd', 'Matthews',         'NC', 'Mecklenburg',  35.1210,  -80.7150),
('Ballantyne ABC',            '14910 Ballantyne Village Way','Charlotte',       'NC', 'Mecklenburg',  35.0610,  -80.8445),
('Mint Hill ABC',             '10131 E W T Harris Blvd',   'Mint Hill',        'NC', 'Mecklenburg',  35.1810,  -80.6668),

-- ── FORSYTH COUNTY — WINSTON-SALEM ──────────────────────────────────────
('WS ABC Country Club',       '4017 Country Club Rd',      'Winston-Salem',    'NC', 'Forsyth',      36.0910,  -80.3048),
('WS ABC Yadkinville',        '3504 Yadkinville Rd',       'Winston-Salem',    'NC', 'Forsyth',      36.1178,  -80.3255),
('WS ABC NW Blvd',            '541 Northwest Blvd',        'Winston-Salem',    'NC', 'Forsyth',      36.1060,  -80.2905),
('WS ABC N Patterson',        '3335 N Patterson Ave',      'Winston-Salem',    'NC', 'Forsyth',      36.1280,  -80.2538),
('WS ABC Peters Creek',       '3188 Peters Creek Pkwy',    'Winston-Salem',    'NC', 'Forsyth',      36.0618,  -80.3222),
('WS ABC S Stratford',        '3250 S Stratford Rd',       'Winston-Salem',    'NC', 'Forsyth',      36.0488,  -80.2820),
('WS ABC Hwy 150',            '12201 N NC-150',            'Winston-Salem',    'NC', 'Forsyth',      36.0350,  -80.4050),

-- ── GUILFORD COUNTY — GREENSBORO / HIGH POINT ────────────────────────────
('Greensboro ABC High Point Rd','3923 High Point Rd',      'Greensboro',       'NC', 'Guilford',     36.0548,  -79.8462),
('Greensboro ABC W Market',   '4633 W Market St',          'Greensboro',       'NC', 'Guilford',     36.0730,  -79.8695),
('Greensboro ABC Battleground','4118 Battleground Ave',    'Greensboro',       'NC', 'Guilford',     36.1040,  -79.8585),
('Greensboro ABC E Market',   '2904 E Market St',          'Greensboro',       'NC', 'Guilford',     36.0795,  -79.7720),
('Greensboro ABC Wendover',   '5302 W Wendover Ave',       'Greensboro',       'NC', 'Guilford',     36.0690,  -79.8880),
('High Point ABC Main',       '700 N Main St',             'High Point',       'NC', 'Guilford',     35.9748,  -80.0145),
('High Point ABC N Centennial','4040 N Centennial St',     'High Point',       'NC', 'Guilford',     36.0120,  -80.0065),

-- ── ALAMANCE COUNTY ──────────────────────────────────────────────────────
('Burlington ABC Vaughn',     '1849 Vaughn Rd',            'Burlington',       'NC', 'Alamance',     36.0980,  -79.4630),
('Graham ABC',                '408 W Harden St',           'Graham',           'NC', 'Alamance',     36.0682,  -79.3965),

-- ── NEW HANOVER COUNTY — WILMINGTON ─────────────────────────────────────
('Wilmington ABC S 17th',     '523 S 17th St',             'Wilmington',       'NC', 'New Hanover',  34.2195,  -77.9220),
('Wilmington ABC Market St',  '8122 Market St',            'Wilmington',       'NC', 'New Hanover',  34.2755,  -77.8062),
('Wilmington ABC Wrightsville','6990 Wrightsville Ave',    'Wilmington',       'NC', 'New Hanover',  34.2270,  -77.8532),
('Wilmington ABC Carolina Beach Rd','4315 Carolina Beach Rd','Wilmington',     'NC', 'New Hanover',  34.1695,  -77.9005),
('Wilmington ABC College Rd', '6250 College Rd',           'Wilmington',       'NC', 'New Hanover',  34.2555,  -77.8562),
('Carolina Beach ABC',        '1020 N Lake Park Blvd',     'Carolina Beach',   'NC', 'New Hanover',  34.0448,  -77.8978),

-- ── BUNCOMBE COUNTY — ASHEVILLE ─────────────────────────────────────────
('Asheville ABC Tunnel Rd',   '145 Tunnel Rd',             'Asheville',        'NC', 'Buncombe',     35.5750,  -82.5132),
('Asheville ABC New Leicester','337 New Leicester Hwy',    'Asheville',        'NC', 'Buncombe',     35.6010,  -82.6228),
('Asheville ABC Merrimon',    '807 Merrimon Ave',          'Asheville',        'NC', 'Buncombe',     35.6138,  -82.5570),
('Asheville ABC Louisiana',   '205 Louisiana Ave',         'Asheville',        'NC', 'Buncombe',     35.5795,  -82.5390),
('Asheville ABC Brevard Rd',  '100 Brevard Rd',            'Asheville',        'NC', 'Buncombe',     35.5490,  -82.5935),
('Arden ABC Long Shoals',     '75 Long Shoals Rd',         'Arden',            'NC', 'Buncombe',     35.5130,  -82.5525),
('Woodfin ABC',               '142 Weaverville Rd',        'Woodfin',          'NC', 'Buncombe',     35.6418,  -82.5592),

-- ── PITT COUNTY — GREENVILLE ─────────────────────────────────────────────
('Greenville ABC E 10th',     '3148 E 10th St',            'Greenville',       'NC', 'Pitt',         35.5910,  -77.3378),
('Greenville ABC Arlington',  '2000 E Arlington Blvd',     'Greenville',       'NC', 'Pitt',         35.5580,  -77.3648),
('Greenville ABC S Memorial', '2307 S Memorial Dr',        'Greenville',       'NC', 'Pitt',         35.5572,  -77.3992),
('Greenville ABC Evans',      '3006 E 14th St',            'Greenville',       'NC', 'Pitt',         35.5985,  -77.3338),
('Winterville ABC',           '4705 Greenville Blvd',      'Winterville',      'NC', 'Pitt',         35.5362,  -77.3998),

-- ── CUMBERLAND COUNTY — FAYETTEVILLE ─────────────────────────────────────
('Fayetteville ABC Owen Dr',  '1705 Owen Dr',              'Fayetteville',     'NC', 'Cumberland',   35.0545,  -78.9828),
('Fayetteville ABC Person St','424 Person St',             'Fayetteville',     'NC', 'Cumberland',   35.0615,  -78.8808),
('Fayetteville ABC Sycamore', '3708 Sycamore Dairy Rd',   'Fayetteville',     'NC', 'Cumberland',   35.0542,  -78.9558),
('Fayetteville ABC Ramsey',   '2820 Ramsey St',            'Fayetteville',     'NC', 'Cumberland',   35.1012,  -78.9092),
('Fayetteville ABC Cliffdale','6700 Cliffdale Rd',         'Fayetteville',     'NC', 'Cumberland',   35.0295,  -78.9878),
('Hope Mills ABC',            '3720 S Main St',            'Hope Mills',       'NC', 'Cumberland',   35.0025,  -78.9518),

-- ── CATAWBA COUNTY — HICKORY ─────────────────────────────────────────────
('Hickory ABC 1st Ave',       '312 1st Ave SW',            'Hickory',          'NC', 'Catawba',      35.7278,  -81.3452),
('Hickory ABC Springs Rd',    '3370 Springs Rd NE',        'Hickory',          'NC', 'Catawba',      35.7678,  -81.3148),
('Hickory ABC N Center',      '2310 N Center St',          'Hickory',          'NC', 'Catawba',      35.7778,  -81.3442),
('Conover ABC',               '4305 NC-16 BUS',            'Conover',          'NC', 'Catawba',      35.7085,  -81.2208),
('Newton ABC',                '201 W A St',                'Newton',           'NC', 'Catawba',      35.6685,  -81.2218),

-- ── OTHER COUNTIES ────────────────────────────────────────────────────────
('Gastonia ABC',              '1840 S York Rd',            'Gastonia',         'NC', 'Gaston',       35.2228,  -81.1808),
('Kannapolis ABC',            '3530 S Ridge Ave',          'Kannapolis',       'NC', 'Cabarrus',     35.4688,  -80.6252),
('Concord ABC',               '7875 Gateway Ln NW',        'Concord',          'NC', 'Cabarrus',     35.4180,  -80.6075),
('Monroe ABC',                '2500 W Roosevelt Blvd',     'Monroe',           'NC', 'Union',        34.9722,  -80.5808),
('Salisbury ABC W Innes',     '1636 W Innes St',           'Salisbury',        'NC', 'Rowan',        35.6728,  -80.5188),
('Salisbury ABC Jake Alex',   '1428 S Jake Alexander Blvd','Salisbury',        'NC', 'Rowan',        35.6445,  -80.4875),
('Lexington ABC',             '419 N Main St',             'Lexington',        'NC', 'Davidson',     35.8272,  -80.2568),
('Hendersonville ABC',        '1540 Four Seasons Blvd',    'Hendersonville',   'NC', 'Henderson',    35.3208,  -82.4608),
('Boone ABC',                 '735 Shadowline Dr',         'Boone',            'NC', 'Watauga',      36.2178,  -81.6798),
('Roxboro ABC',               '712 N Madison Blvd',        'Roxboro',          'NC', 'Person',       36.3938,  -78.9852),
('Henderson ABC',             '541 N Garnett St',          'Henderson',        'NC', 'Vance',        36.3295,  -78.4122),
('Wilson ABC',                '1700 US-301 S',             'Wilson',           'NC', 'Wilson',       35.7188,  -77.9255),
('Rocky Mount ABC',           '3725 Sunset Ave',           'Rocky Mount',      'NC', 'Nash',         35.9520,  -77.8432),
('Goldsboro ABC',             '600 E Elm St',              'Goldsboro',        'NC', 'Wayne',        35.3840,  -77.9780),
('Kinston ABC',               '217 W Vernon Ave',          'Kinston',          'NC', 'Lenoir',       35.2665,  -77.5825),
('Jacksonville ABC',          '1025 Gum Branch Rd',        'Jacksonville',     'NC', 'Onslow',       34.7535,  -77.4310),
('New Bern ABC',              '3210 Trent Rd',             'New Bern',         'NC', 'Craven',       35.1025,  -77.0438),
('Sanford ABC',               '1415 S Horner Blvd',        'Sanford',          'NC', 'Lee',          35.4790,  -79.1870),
('Lumberton ABC',             '2400 Roberts Ave',          'Lumberton',        'NC', 'Robeson',      34.6478,  -79.0132),
('Elizabeth City ABC',        '400 E Colonial Ave',        'Elizabeth City',   'NC', 'Pasquotank',   36.2942,  -76.2500);
