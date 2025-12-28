'use client'

import { useState } from 'react'
import Header from '../components/Header'
import ViewToggle, { ViewMode } from '../components/ViewToggle'
import World3DView from '../components/World3DView'
import { useApp } from '../contexts/AppContext'
import { QuickSearchWidget, FiltersWidget, TrendingWidget, QuickActionsWidget } from '../components/Widgets'
import { Heart, MapPin } from 'lucide-react'

export default function MapPage() {
  const { smokingPlaces, favoritePlaces, addFavoritePlace, removeFavoritePlace } = useApp()
  const [viewMode, setViewMode] = useState<ViewMode>('map')

  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {/* View Toggle */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: viewMode === 'world' ? '1fr' : 'minmax(250px, 300px) 1fr', 
          gap: '2rem',
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
          }
        } as React.CSSProperties}>
          {/* Sidebar with Widgets (hidden in world view) */}
          {viewMode !== 'world' && (
            <aside style={{ display: 'flex', flexDirection: 'column' }}>
              <QuickSearchWidget />
              <FiltersWidget />
              <TrendingWidget />
              <QuickActionsWidget />
            </aside>
          )}

          {/* Main Content Area */}
          <div style={{ 
            minHeight: '600px',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {viewMode === 'world' ? (
              <World3DView />
            ) : viewMode === 'map' ? (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: '600px',
              }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Map View</h2>
                <div style={{ 
                  backgroundColor: 'var(--bg-primary)', 
                  padding: '2rem', 
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  maxWidth: '600px',
                  textAlign: 'center',
                }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    🗺️ Interactive map with Google Maps integration
                  </p>
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                    <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                      ✅ Google Maps API key configured
                    </p>
                  ) : (
                    <>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        To enable map functionality, add your Google Maps API key:
                      </p>
                      <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        marginTop: '1rem',
                      }}>
                        <p style={{ marginBottom: '0.5rem' }}>1. Get API key: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google Cloud Console</a></p>
                        <p style={{ marginBottom: '0.5rem' }}>2. Add to Vercel: <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></p>
                        <p>3. Map will automatically load after redeploy</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '2rem',
                minHeight: '600px',
              }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>List View</h2>
                {smokingPlaces.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No places found. Start exploring to add places to your list!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {smokingPlaces.map((place) => {
                      const isFavorite = favoritePlaces.some(fp => fp.id === place.id)
                      return (
                        <div
                          key={place.id}
                          style={{
                            padding: '1.5rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '1rem',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{place.name}</h3>
                            {place.description && (
                              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                {place.description}
                              </p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              <MapPin size={16} />
                              <span>{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                              {place.rating && (
                                <>
                                  <span>•</span>
                                  <span>⭐ {place.rating}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => isFavorite ? removeFavoritePlace(place.id) : addFavoritePlace(place)}
                            style={{
                              padding: '0.5rem',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: isFavorite ? 'var(--accent)' : 'var(--text-secondary)',
                            }}
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart size={20} fill={isFavorite ? 'var(--accent)' : 'none'} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

