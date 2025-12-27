'use client'

import Header from '../components/Header'
import { useApp } from '../contexts/AppContext'
import { Heart, MapPin } from 'lucide-react'

export default function GalleryPage() {
  const { favoritePlaces } = useApp()

  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>My Gallery</h1>
        
        {favoritePlaces.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <Heart size={64} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
              No favorite places yet. Start exploring the map to add places to your gallery!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {favoritePlaces.map(place => (
              <div
                key={place.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                {place.imageUrl && (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: 'var(--bg-tertiary)',
                    backgroundImage: `url(${place.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
                )}
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    {place.name}
                  </h3>
                  {place.description && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {place.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={16} />
                    <span>{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

