import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// In-memory storage (replace with database later)
// This should match the users from signup route
const users: Record<string, any> = {
  'paparopapari': {
    id: '1',
    username: 'paparopapari',
    email: 'paparopapari@example.com',
    password: 'password123', // In production, hash this!
    role: 'user',
    createdAt: new Date().toISOString(),
  },
}

const sessions: Record<string, any> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    const user = users[username]

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Set cookie
    const cookieStore = cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Store session
    sessions[sessionToken] = { userId: user.id, username: user.username }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to login', details: error.message },
      { status: 500 }
    )
  }
}

