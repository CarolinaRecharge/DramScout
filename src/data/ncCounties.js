// src/data/ncCounties.js
// Authoritative list of NC counties with centroid coordinates and region groupings.

export const NC_COUNTY_CENTROIDS = {
  // Triangle
  "Wake":         { lat: 35.7920, lng: -78.6520 },
  "Durham":       { lat: 35.9940, lng: -78.8986 },
  "Orange":       { lat: 36.0607, lng: -79.1200 },
  "Chatham":      { lat: 35.7070, lng: -79.2560 },
  "Johnston":     { lat: 35.5090, lng: -78.3360 },

  // Charlotte
  "Mecklenburg":  { lat: 35.2560, lng: -80.8430 },
  "Union":        { lat: 34.9870, lng: -80.5310 },
  "Cabarrus":     { lat: 35.3870, lng: -80.5510 },
  "Gaston":       { lat: 35.2970, lng: -81.1790 },
  "Iredell":      { lat: 35.8060, lng: -80.8880 },

  // Triad
  "Forsyth":      { lat: 36.1320, lng: -80.2440 },
  "Guilford":     { lat: 36.0727, lng: -79.7920 },
  "Alamance":     { lat: 36.0410, lng: -79.3990 },
  "Randolph":     { lat: 35.7180, lng: -79.8040 },

  // Wilmington
  "New Hanover":  { lat: 34.1860, lng: -77.8660 },
  "Brunswick":    { lat: 33.9870, lng: -78.2360 },
  "Pender":       { lat: 34.5090, lng: -77.8880 },

  // Asheville / Western
  "Buncombe":     { lat: 35.5900, lng: -82.5510 },
  "Henderson":    { lat: 35.3250, lng: -82.4710 },
  "Haywood":      { lat: 35.5630, lng: -82.9820 },
  "Jackson":      { lat: 35.2820, lng: -83.1300 },

  // Fayetteville / Cumberland
  "Cumberland":   { lat: 35.0460, lng: -78.8780 },
  "Hoke":         { lat: 35.0130, lng: -79.2220 },

  // Raleigh / Eastern
  "Nash":         { lat: 35.9760, lng: -77.9820 },
  "Wilson":       { lat: 35.7130, lng: -77.9180 },
  "Pitt":         { lat: 35.5920, lng: -77.3720 },
  "Wayne":        { lat: 35.3590, lng: -77.9820 },

  // Other notable
  "Rowan":        { lat: 35.6420, lng: -80.5320 },
  "Davidson":     { lat: 35.7790, lng: -80.2230 },
  "Catawba":      { lat: 35.6590, lng: -81.2280 },
  "Burke":        { lat: 35.7490, lng: -81.7100 },
  "Lincoln":      { lat: 35.4730, lng: -81.2280 },
  "Stanly":       { lat: 35.3070, lng: -80.2550 },
  "Anson":        { lat: 34.9750, lng: -80.0860 },
  "Richmond":     { lat: 34.9480, lng: -79.7440 },
  "Moore":        { lat: 35.3180, lng: -79.4820 },
  "Lee":          { lat: 35.4790, lng: -79.1680 },
  "Harnett":      { lat: 35.3560, lng: -78.8730 },
  "Sampson":      { lat: 35.0090, lng: -78.3660 },
  "Columbus":     { lat: 34.2660, lng: -78.6580 },
  "Bladen":       { lat: 34.6110, lng: -78.5570 },
  "Duplin":       { lat: 34.9310, lng: -77.9580 },
  "Onslow":       { lat: 34.7570, lng: -77.3990 },
  "Carteret":     { lat: 34.8320, lng: -76.7340 },
  "Craven":       { lat: 35.1000, lng: -77.0750 },
  "Lenoir":       { lat: 35.2400, lng: -77.6100 },
  "Greene":       { lat: 35.4730, lng: -77.6700 },
  "Edgecombe":    { lat: 35.9120, lng: -77.5960 },
  "Halifax":      { lat: 36.2550, lng: -77.6540 },
  "Northampton":  { lat: 36.4160, lng: -77.3990 },
  "Bertie":       { lat: 35.9040, lng: -76.9940 },
  "Hertford":     { lat: 36.3360, lng: -76.9840 },
  "Gates":        { lat: 36.4280, lng: -76.6730 },
  "Chowan":       { lat: 36.0790, lng: -76.6090 },
  "Perquimans":   { lat: 36.1710, lng: -76.4070 },
  "Pasquotank":   { lat: 36.2970, lng: -76.2430 },
  "Camden":       { lat: 36.3680, lng: -76.1610 },
  "Currituck":    { lat: 36.4200, lng: -76.0220 },
  "Dare":         { lat: 35.7140, lng: -75.8990 },
  "Hyde":         { lat: 35.4050, lng: -76.1870 },
  "Tyrrell":      { lat: 35.8580, lng: -76.1760 },
  "Washington":   { lat: 35.8450, lng: -76.6470 },
  "Martin":       { lat: 35.8420, lng: -77.0940 },
  "Beaufort":     { lat: 35.4490, lng: -76.8390 },
  "Pamlico":      { lat: 35.1360, lng: -76.6090 },
  "Jones":        { lat: 34.9820, lng: -77.3670 },
  "Scotch":       { lat: 35.3920, lng: -79.4820 },
  "Montgomery":   { lat: 35.3300, lng: -79.8750 },
  "Vance":        { lat: 36.3530, lng: -78.4000 },
  "Granville":    { lat: 36.3040, lng: -78.6530 },
  "Franklin":     { lat: 36.0870, lng: -78.2870 },
  "Person":       { lat: 36.3920, lng: -78.9710 },
  "Caswell":      { lat: 36.3920, lng: -79.3310 },
  "Rockingham":   { lat: 36.3920, lng: -79.7690 },
  "Stokes":       { lat: 36.3920, lng: -80.2360 },
  "Surry":        { lat: 36.4060, lng: -80.6870 },
  "Yadkin":       { lat: 36.1540, lng: -80.6640 },
  "Wilkes":       { lat: 36.1500, lng: -81.1620 },
  "Alexander":    { lat: 35.9220, lng: -81.1780 },
  "Caldwell":     { lat: 35.9690, lng: -81.5380 },
  "Avery":        { lat: 36.0820, lng: -82.0560 },
  "Mitchell":     { lat: 36.0030, lng: -82.1650 },
  "Yancey":       { lat: 35.8980, lng: -82.3100 },
  "Madison":      { lat: 35.8570, lng: -82.7060 },
  "McDowell":     { lat: 35.6800, lng: -82.0250 },
  "Polk":         { lat: 35.2900, lng: -82.1560 },
  "Rutherford":   { lat: 35.4000, lng: -81.9240 },
  "Cleveland":    { lat: 35.3400, lng: -81.5500 },
  "Macon":        { lat: 35.1500, lng: -83.4220 },
  "Clay":         { lat: 35.0570, lng: -83.7490 },
  "Cherokee":     { lat: 35.1500, lng: -84.0440 },
  "Graham":       { lat: 35.3550, lng: -83.8340 },
  "Swain":        { lat: 35.4900, lng: -83.4880 },
  "Transylvania": { lat: 35.1900, lng: -82.8060 },
}

export const NC_REGIONS = {
  "Triangle":     ["Wake", "Durham", "Orange", "Chatham", "Johnston"],
  "Charlotte":    ["Mecklenburg", "Union", "Cabarrus", "Gaston", "Iredell", "Lincoln", "Stanly"],
  "Triad":        ["Forsyth", "Guilford", "Alamance", "Randolph", "Davidson", "Rowan"],
  "Wilmington":   ["New Hanover", "Brunswick", "Pender", "Onslow", "Columbus"],
  "Asheville":    ["Buncombe", "Henderson", "Haywood", "Jackson", "Madison", "Transylvania", "Polk", "Rutherford", "McDowell", "Yancey"],
  "Fayetteville": ["Cumberland", "Hoke", "Moore", "Lee", "Harnett", "Sampson"],
  "Western NC":   ["Burke", "Catawba", "Alexander", "Caldwell", "Wilkes", "Surry", "Yadkin", "Stokes", "Avery", "Mitchell", "Cherokee", "Macon", "Clay", "Graham", "Swain"],
  "Eastern NC":   ["Nash", "Wilson", "Pitt", "Wayne", "Edgecombe", "Halifax", "Northampton", "Bertie", "Lenoir", "Greene", "Duplin", "Beaufort", "Craven", "Carteret", "Dare", "Hyde", "Pamlico", "Jones", "Bladen"],
  "Other":        ["Vance", "Granville", "Franklin", "Person", "Caswell", "Rockingham", "Anson", "Richmond", "Montgomery", "Hertford", "Gates", "Chowan", "Perquimans", "Pasquotank", "Camden", "Currituck", "Tyrrell", "Washington", "Martin", "Scotch"],
}

/**
 * Haversine distance in miles between two lat/lng points
 */
export function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Given a county name, return its centroid coords.
 * Falls back to NC geographic center if county not found.
 */
export function getCountyCentroid(countyName) {
  return NC_COUNTY_CENTROIDS[countyName] ?? { lat: 35.5, lng: -79.5 }
}
