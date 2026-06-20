import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth/session'
import { writeLimit } from '@/lib/rate-limit'

// This endpoint integrates with the Google Places API (a paid/quota'd API).
// Gate it: signed-in users only + per-IP rate limit so it can't be looped to
// burn quota. NOTE: it currently reads NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, which
// is also shipped to the browser — swap to a non-public server key if kept.
export async function POST(request: NextRequest) {
  const blocked = writeLimit.check(request, 'places-google')
  if (blocked) return blocked
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { query, location, type } = body

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Google Places API Text Search
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location.lat},${location.lng}&radius=5000&type=${type}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    const placesData = await placesResponse.json()

    if (placesData.status !== 'OK') {
      return NextResponse.json(
        { error: 'Google Places API error', details: placesData.status },
        { status: 500 }
      )
    }

    // Transform Google Places data to our format
    const places = placesData.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      description: place.formatted_address,
      rating: place.rating,
      reviews: place.user_ratings_total,
      type: type || 'spot',
      googlePlaceId: place.place_id,
      verified: true, // From Google, so verified
    }))

    return NextResponse.json({ places, total: places.length })
  } catch (error: any) {
    console.error('Google Places API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch places from Google', details: error.message },
      { status: 500 }
    )
  }
}

// Endpoint to sync/update places from Google Maps
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location') // e.g., "Athens, Greece"
    const type = searchParams.get('type') || 'establishment'

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter required' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Search for places in the location
    const query = `${type} ${location}`
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: 'Google Places API error', details: data.status },
        { status: 500 }
      )
    }

    const places = data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      description: place.formatted_address,
      rating: place.rating,
      reviews: place.user_ratings_total,
      type: type,
      googlePlaceId: place.place_id,
      verified: true,
    }))

    return NextResponse.json({ places, total: places.length })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to sync places', details: error.message },
      { status: 500 }
    )
  }
}

