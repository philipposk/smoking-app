'use client'

import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from '../components/LoginModal'
import { useState } from 'react'
import { User, Mail, Calendar, Shield } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  if (loading) {
    return (
      <>
        <Header />
        <main style={{
          minHeight: 'calc(100vh - 80px)',
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </main>
      </>
    )
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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <User size={32} />
          Profile
        </h1>
        
        {user ? (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
              }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{user.username}</h2>
                {user.role && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Shield size={16} />
                    <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Mail size={20} />
                <span>{user.email}</span>
              </div>
              {user.createdAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={20} />
                  <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              Please log in to view your profile.
            </p>
            <button onClick={() => setShowLoginModal(true)}>
              Login or Sign Up
            </button>
          </div>
        )}
      </main>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  )
}
