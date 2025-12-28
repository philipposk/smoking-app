import { NextRequest, NextResponse } from 'next/server'

interface ClaimRequest {
  placeId: string
  merchantName: string
  merchantEmail: string
  businessLicense?: string
  proofOfOwnership?: string
}

// In a real app, this would be stored in a database
const claimedPlaces: Record<string, any> = {}

export async function POST(request: NextRequest) {
  try {
    const body: ClaimRequest = await request.json()

    if (!body.placeId || !body.merchantName || !body.merchantEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In a real app, you would:
    // 1. Verify the merchant owns the place
    // 2. Send verification email
    // 3. Store claim in database
    // 4. Set merchantClaimed flag

    claimedPlaces[body.placeId] = {
      placeId: body.placeId,
      merchantName: body.merchantName,
      merchantEmail: body.merchantEmail,
      claimedAt: new Date().toISOString(),
      status: 'pending', // pending, verified, rejected
    }

    return NextResponse.json({
      message: 'Claim submitted successfully. You will receive a verification email.',
      claim: claimedPlaces[body.placeId],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit claim', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const placeId = searchParams.get('placeId')

  if (placeId && claimedPlaces[placeId]) {
    return NextResponse.json({ claim: claimedPlaces[placeId] })
  }

  return NextResponse.json({ claims: Object.values(claimedPlaces) })
}

