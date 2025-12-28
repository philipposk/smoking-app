import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// In-memory storage (should match login/signup)
const users: Record<string, any> = {
  'paparopapari': {
    id: '1',
    username: 'paparopapari',
    email: 'paparopapari@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
}

const sessions: Record<string, any> = {}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null })
    }

    const session = sessions[sessionToken]
    if (!session) {
      return NextResponse.json({ user: null })
    }

    const user = users[session.username]
    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error: any) {
    return NextResponse.json({ user: null })
  }
}

