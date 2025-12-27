'use client'

import { useState } from 'react'
import Header from '../components/Header'
import { useApp } from '../contexts/AppContext'

export default function MapPage() {
  const { smokingPlaces } = useApp()
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <>
      <Header />
      <main style={{
        height: 'calc(100vh - 80px)',
        position: 'relative',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Map View</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Google Maps integration coming soon
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Add your Google Maps API key to enable map functionality
          </p>
        </div>
      </main>
    </>
  )
}

