'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { MessageSquare, Send, Plus, Heart, User } from 'lucide-react'

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  replies?: any[]
  likes?: number
  tags?: string[]
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/forum/posts')
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) throw new Error('Failed to create post')

      setNewPost({ title: '', content: '', tags: '' })
      setShowNewPostForm(false)
      loadPosts()
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MessageSquare size={32} />
            Community Forum
          </h1>
          <button
            onClick={() => setShowNewPostForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={20} />
            New Post
          </button>
        </div>

        {showNewPostForm && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Post</h2>
            <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Post title..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
                style={{ width: '100%' }}
              />
              <textarea
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                required
                rows={5}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <input
                type="text"
                placeholder="Tags (comma separated): athens, spots, recommendations"
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Posting...' : 'Post'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPostForm(false)
                    setNewPost({ title: '', content: '', tags: '' })
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '3rem',
              textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1rem' }}>
                No posts yet. Be the first to start a discussion!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{post.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={16} />
                        <span>{post.author}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: 'var(--bg-tertiary)',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              color: 'var(--accent)',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Heart size={18} />
                    <span>{post.likes || 0}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                  {post.content}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <MessageSquare size={16} />
                    Reply ({post.replies?.length || 0})
                  </button>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <Heart size={16} />
                    Like
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}

