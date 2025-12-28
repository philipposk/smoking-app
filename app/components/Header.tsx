'use client'

import Link from 'next/link'
import { useTheme } from '../contexts/ThemeContext'
import { Moon, Sun, Map, Images, MessageSquare, User } from 'lucide-react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

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
    </header>
  )
}

