'use client'

import Header from '../components/Header'
import { MessageSquare, Send } from 'lucide-react'

export default function ForumPage() {
  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MessageSquare size={32} />
          Community Forum
        </h1>
        
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Community forum coming soon!
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Connect with others, share experiences, and discuss smoking-related topics.
          </p>
        </div>
      </main>
    </>
  )
}

