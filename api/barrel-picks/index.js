import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/barrel-picks
// Public feed of published barrel picks, optionally sorted by distance.
// Query params: lat, lng, radius_miles (default 50), status (default "available,low"),
//               distillery, limit (default 20), offset (default 0)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    lat,
    lng,
    radius_miles = '50',
    status = 'available,low',
    distillery,
    limit = '20',
    offset = '0',
  } = req.query

  const statusList = status.split(',').map(s => s.trim()).filter(Boolean)
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100)
  const offsetNum = parseInt(offset, 10) || 0

  const latNum = lat ? parseFloat(lat) : null
  const lngNum = lng ? parseFloat(lng) : null
  const hasCoords = latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum)

  let query

  if (hasCoords) {
    // Distance-sorted query using PostGIS via RPC or raw SQL
    // We use the admin client's rpc to call a stored function, or fall back to
    // a plain query and compute distance in JS for simplicity in this env.
    // Using direct SQL via admin client's from().select() with PostGIS:
    const radiusMiles = parseFloat(radius_miles) || 50
    const radiusMeters = radiusMiles * 1609.344

    // Build a query that joins barrel_picks → store_profiles → stores for lat/lng
    // We fetch all matching picks then sort by distance JS-side to avoid
    // needing a custom RPC function installed. For production scale, a DB function
    // would be better. This keeps zero additional DB dependencies.
    query = supabaseAdmin
      .from('barrel_picks')
      .select(`
        *,
        store_profiles!inner (
          id, store_name, address, county, comments_enabled,
          stores ( id, lat, lng, name, address, city, state )
        ),
        barrel_pick_reports ( id, report_type ),
        barrel_pick_comments ( id )
      `)
      .eq('is_published', true)
      .order('arrival_date', { ascending: false })
      .range(offsetNum, offsetNum + limitNum * 3 - 1) // fetch extra to filter by radius
  } else {
    query = supabaseAdmin
      .from('barrel_picks')
      .select(`
        *,
        store_profiles!inner (
          id, store_name, address, county, comments_enabled,
          stores ( id, lat, lng, name, address, city, state )
        ),
        barrel_pick_reports ( id, report_type ),
        barrel_pick_comments ( id )
      `)
      .eq('is_published', true)
      .order('arrival_date', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1)
  }

  if (distillery) {
    query = query.ilike('distillery', `%${distillery}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('barrel-picks GET:', error.message, error.code, error.details, error.hint)
    return res.status(500).json({ error: error.message || 'Failed to fetch barrel picks', code: error.code })
  }

  // Shape and optionally filter/sort by distance
  let picks = (data || []).map(pick => {
    const storeData = pick.store_profiles
    const linkedStore = storeData?.stores

    const reportCounts = (pick.barrel_pick_reports || []).reduce((acc, r) => {
      acc[r.report_type] = (acc[r.report_type] || 0) + 1
      return acc
    }, {})

    let distanceMiles = null
    if (hasCoords && linkedStore?.lat && linkedStore?.lng) {
      distanceMiles = haversineMiles(latNum, lngNum, linkedStore.lat, linkedStore.lng)
    }

    return {
      id: pick.id,
      store_id: pick.store_id,
      distillery: pick.distillery,
      brand: pick.brand,
      expression: pick.expression,
      barrel_number: pick.barrel_number,
      warehouse_rick: pick.warehouse_rick,
      age_stated: pick.age_stated,
      proof: pick.proof,
      vintage_year: pick.vintage_year,
      label_name: pick.label_name,
      selected_by: pick.selected_by,
      selection_date: pick.selection_date,
      arrival_date: pick.arrival_date,
      price_per_bottle: pick.price_per_bottle,
      bottles_total: pick.bottles_total,
      bottles_remaining: pick.bottles_remaining,
      msrp: pick.msrp,
      store_notes: pick.store_notes,
      tasting_notes: pick.tasting_notes || [],
      status: pick.status,
      is_featured: pick.is_featured || false,
      photo_urls: pick.photo_urls || [],
      primary_photo_url: pick.primary_photo_url,
      store_name: storeData?.store_name || null,
      store_address: linkedStore?.address || storeData?.address || null,
      store_city: linkedStore?.city || storeData?.county || null,
      store_state: linkedStore?.state || null,
      store_lat: linkedStore?.lat || null,
      store_lng: linkedStore?.lng || null,
      distance_miles: distanceMiles !== null ? Math.round(distanceMiles * 10) / 10 : null,
      reports_count: reportCounts,
      comments_count: (pick.barrel_pick_comments || []).length,
      comments_enabled: pick.comments_enabled ?? true,
      created_at: pick.created_at,
    }
  })

  // Apply status filter in JS so featured picks can bypass it
  picks = picks.filter(p => p.is_featured || statusList.includes(p.status))

  if (hasCoords) {
    const radiusMilesNum = parseFloat(radius_miles) || 50
    picks = picks
      .filter(p => p.is_featured || p.distance_miles === null || p.distance_miles <= radiusMilesNum)
      .sort((a, b) => {
        // Featured picks always sort first
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        if (a.distance_miles === null && b.distance_miles === null) return 0
        if (a.distance_miles === null) return 1
        if (b.distance_miles === null) return -1
        return a.distance_miles - b.distance_miles
      })
      .slice(0, limitNum)
  }

  return res.status(200).json({ picks, total: picks.length })
}

// Haversine distance in miles
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}
