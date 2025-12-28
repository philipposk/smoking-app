import { NextRequest, NextResponse } from 'next/server'

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  createdAt: string
  replies?: ForumReply[]
  likes?: number
  tags?: string[]
}

interface ForumReply {
  id: string
  postId: string
  content: string
  author: string
  authorId: string
  createdAt: string
  likes?: number
}

// In-memory storage (replace with database later)
let posts: ForumPost[] = [
  {
    id: '1',
    title: 'Best smoking spots in Athens?',
    content: 'Looking for recommendations for good outdoor smoking spots in Athens. Any hidden gems?',
    author: 'paparopapari',
    authorId: '1',
    createdAt: new Date().toISOString(),
    replies: [],
    likes: 5,
    tags: ['athens', 'spots', 'recommendations'],
  },
  {
    id: '2',
    title: 'Where to find big rolling papers in Thailand?',
    content: 'Having trouble finding large rolling papers here. Any shop recommendations?',
    author: 'paparopapari',
    authorId: '1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    replies: [],
    likes: 3,
    tags: ['thailand', 'shops', 'rolling-papers'],
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')

  let filteredPosts = [...posts]

  if (tag) {
    filteredPosts = filteredPosts.filter(post => post.tags?.includes(tag))
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredPosts = filteredPosts.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower)
    )
  }

  // Sort by date (newest first)
  filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ posts: filteredPosts })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newPost: ForumPost = {
      id: Date.now().toString(),
      title: body.title,
      content: body.content,
      author: body.author || 'paparopapari',
      authorId: body.authorId || '1',
      createdAt: new Date().toISOString(),
      replies: [],
      likes: 0,
      tags: body.tags || [],
    }

    posts.push(newPost)

    return NextResponse.json({ post: newPost, message: 'Post created successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create post', details: error.message },
      { status: 500 }
    )
  }
}

