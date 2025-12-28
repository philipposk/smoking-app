'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

interface Recommendation {
  name: string
  description: string
  whyRecommended: string
}

export default function AIRecommendations() {
  const { favoritePlaces, smokingPlaces } = useApp()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favoritePlaces: favoritePlaces.map(p => p.name),
          userPreferences: ['outdoor', 'comfortable'],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      const recs = data.recommendations?.recommendations || data.recommendations || []
      setRecommendations(Array.isArray(recs) ? recs : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Sparkles size={32} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.5rem' }}>AI Recommendations</h2>
      </div>

      <button
        onClick={getRecommendations}
        disabled={loading}
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Getting recommendations...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Get AI Recommendations
          </>
        )}
      </button>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '8px',
          color: '#ff4444',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {rec.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {rec.description}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>
                💡 {rec.whyRecommended}
              </p>
            </div>
          ))}
        </div>
      )}

      {recommendations.length === 0 && !loading && !error && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Click the button above to get AI-powered recommendations based on your preferences and favorite places.
        </p>
      )}
    </div>
  )
}

