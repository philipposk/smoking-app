import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    cookieStore.delete('session')

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to logout', details: error.message },
      { status: 500 }
    )
  }
}

