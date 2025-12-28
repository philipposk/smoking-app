import { NextRequest, NextResponse } from 'next/server'

// In-memory storage (replace with database later)
let replies: any[] = []

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postId = searchParams.get('postId')

  if (postId) {
    const postReplies = replies.filter(r => r.postId === postId)
    return NextResponse.json({ replies: postReplies })
  }

  return NextResponse.json({ replies })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newReply = {
      id: Date.now().toString(),
      postId: body.postId,
      content: body.content,
      author: body.author || 'paparopapari',
      authorId: body.authorId || '1',
      createdAt: new Date().toISOString(),
      likes: 0,
    }

    replies.push(newReply)

    return NextResponse.json({ reply: newReply, message: 'Reply posted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to post reply', details: error.message },
      { status: 500 }
    )
  }
}

