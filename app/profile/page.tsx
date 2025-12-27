'use client'

import Header from '../components/Header'
import { useApp } from '../contexts/AppContext'
import { User, Mail, Calendar, Heart } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useApp()

  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Profile</h1>
        
        {!user ? (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <User size={64} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1rem' }}>
              Please sign in to view your profile
            </p>
            <button>Sign In</button>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '2rem',
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>User Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <User size={20} />
                  <span>{user.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Mail size={20} />
                  <span>{user.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Calendar size={20} />
                  <span>Age: {user.age}+</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Heart size={20} />
                  <span>{user.favoritePlaces.length} favorite places</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

