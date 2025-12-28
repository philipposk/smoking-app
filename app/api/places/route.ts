import { NextRequest, NextResponse } from 'next/server'

interface Place {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
  type: 'spot' | 'shop' | 'cafe' | 'dispensary' | 'kiosk' | 'convenience'
  rating?: number
  reviews?: number
  contributedBy?: string
  verified?: boolean
  merchantClaimed?: boolean
  accessible?: boolean
  notes?: string
}

// In-memory storage (replace with database later)
let places: Place[] = [
  {
    id: '1',
    name: 'Kolonaki Square',
    lat: 37.9838,
    lng: 23.7275,
    description: 'Popular outdoor spot in Athens',
    type: 'spot',
    rating: 4.5,
    reviews: 12,
    accessible: true,
  },
  {
    id: '2',
    name: 'Plaka District',
    lat: 37.9715,
    lng: 23.7268,
    description: 'Historic area with great views',
    type: 'spot',
    rating: 4.2,
    reviews: 8,
    accessible: true,
  },
  {
    id: '3',
    name: 'Thessaloniki Waterfront',
    lat: 40.6401,
    lng: 22.9444,
    description: 'Beautiful seaside location',
    type: 'spot',
    rating: 4.7,
    reviews: 15,
    accessible: true,
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const type = searchParams.get('type')
  const radius = searchParams.get('radius') || '5000' // meters

  let filteredPlaces = [...places]

  // Filter by location if provided
  if (lat && lng) {
    const centerLat = parseFloat(lat)
    const centerLng = parseFloat(lng)
    const radiusMeters = parseFloat(radius)

    filteredPlaces = filteredPlaces.filter(place => {
      const distance = getDistanceFromLatLonInMeters(
        centerLat,
        centerLng,
        place.lat,
        place.lng
      )
      return distance <= radiusMeters
    })
  }

  // Filter by type
  if (type) {
    filteredPlaces = filteredPlaces.filter(place => place.type === type)
  }

  return NextResponse.json({ places: filteredPlaces })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newPlace: Place = {
      id: Date.now().toString(),
      name: body.name,
      lat: body.lat,
      lng: body.lng,
      description: body.description,
      type: body.type || 'spot',
      contributedBy: body.userId || 'anonymous',
      verified: false,
      accessible: body.accessible !== false,
      notes: body.notes,
    }

    places.push(newPlace)

    return NextResponse.json({ place: newPlace, message: 'Place added successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add place', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in meters
  return d
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

