'use client'

import { useState } from 'react'
import Header from '../components/Header'
import ViewToggle, { ViewMode } from '../components/ViewToggle'
import World3DView from '../components/World3DView'
import { useApp } from '../contexts/AppContext'
import { QuickSearchWidget, FiltersWidget, TrendingWidget, QuickActionsWidget } from '../components/Widgets'

export default function MapPage() {
  const { smokingPlaces } = useApp()
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

        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'world' ? '1fr' : '300px 1fr', gap: '2rem' }}>
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
                <p style={{ color: 'var(--text-secondary)' }}>
                  Google Maps integration coming soon
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Add your Google Maps API key to enable map functionality
                </p>
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
                    {smokingPlaces.map((place) => (
                      <div
                        key={place.id}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{place.name}</h3>
                        {place.description && (
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {place.description}
                          </p>
                        )}
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                        </p>
                      </div>
                    ))}
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

