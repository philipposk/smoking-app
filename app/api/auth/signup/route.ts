import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// In-memory storage (replace with database later)
const users: Record<string, any> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (users[username] || Object.values(users).find((u: any) => u.email === email)) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    // Create user (in production, hash password!)
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password, // In production, hash this with bcrypt!
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    users[username] = user

    // Create session (in production, use JWT or session tokens)
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Set cookie
    const cookieStore = cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Store session (in production, use Redis or database)
    const sessions: Record<string, any> = {}
    sessions[sessionToken] = { userId: user.id, username: user.username }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Account created successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    )
  }
}

