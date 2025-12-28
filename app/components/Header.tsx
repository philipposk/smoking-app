'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from './LoginModal'
import { Moon, Sun, Map, Images, MessageSquare, User, LogOut } from 'lucide-react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <header style={{
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        🚬 Smoking App
      </Link>
      
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/map" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Map size={20} />
          Map
        </Link>
        <Link href="/gallery" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Images size={20} />
          Gallery
        </Link>
        <Link href="/forum" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <MessageSquare size={20} />
          Forum
        </Link>
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <User size={20} />
          Profile
        </Link>
        <Link href="/about" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          About
        </Link>
        {user ? (
          <>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {user.username}
            </span>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
            }}
          >
            <User size={18} />
            Login
          </button>
        )}
        <button
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-primary)',
          }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </header>
  )
}

