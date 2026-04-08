// src/hooks/useProfile.js
// Single source of truth for the current user's home county profile data.
import { useState, useEffect } from 'react'
import { fetchHomeCounty, updateHomeCounty as dbUpdateHomeCounty } from '../supabase.js'

const NC_DEFAULT = { lat: 35.7796, lng: -78.6382 } // Raleigh — matches existing map default

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchHomeCounty(userId)
      .then(data => setProfile(data))
      .finally(() => setLoading(false))
  }, [userId])

  async function updateHomeCounty(county) {
    const updated = await dbUpdateHomeCounty(userId, county)
    setProfile(updated)
    return updated
  }

  // Returns centroid of home county; falls back to Raleigh when no county set
  const homeCoords = profile?.home_county_lat
    ? { lat: profile.home_county_lat, lng: profile.home_county_lng }
    : NC_DEFAULT

  const hasHomeCounty = Boolean(profile?.home_county)

  // Show onboarding when profile row loaded (not null) but onboarding not yet complete
  const isOnboardingNeeded = profile !== null && !loading && !profile.onboarding_complete

  return { profile, loading, homeCoords, hasHomeCounty, isOnboardingNeeded, updateHomeCounty }
}
