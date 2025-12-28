'use client'

import { useState } from 'react'
import { RefreshCw, MapPin } from 'lucide-react'

interface GooglePlacesSyncProps {
  location: string
  onSyncComplete: (places: any[]) => void
}

export default function GooglePlacesSync({ location, onSyncComplete }: GooglePlacesSyncProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [synced, setSynced] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/places/google?location=${encodeURIComponent(location)}&type=establishment`)
      
      if (!response.ok) {
        throw new Error('Failed to sync places')
      }

      const data = await response.json()
      onSyncComplete(data.places || [])
      setSynced(true)
    } catch (err: any) {
      setError(err.message || 'Failed to sync places from Google Maps')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <MapPin size={20} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.1rem' }}>Sync from Google Maps</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Automatically discover places from Google Maps for: <strong>{location}</strong>
      </p>
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '8px',
          color: '#ff4444',
          fontSize: '0.85rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}
      {synced && !error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '8px',
          color: '#4ade80',
          fontSize: '0.85rem',
          marginBottom: '1rem',
        }}>
          ✅ Places synced successfully!
        </div>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: loading ? 0.6 : 1,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw size={18} />
            Sync Places from Google Maps
          </>
        )}
      </button>
    </div>
  )
}

