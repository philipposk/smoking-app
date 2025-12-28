'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '../components/Header'
import ViewToggle, { ViewMode } from '../components/ViewToggle'
import World3DView from '../components/World3DView'
import { useApp } from '../contexts/AppContext'
import { QuickSearchWidget, FiltersWidget, TrendingWidget, QuickActionsWidget } from '../components/Widgets'
import GoogleMap from '../components/GoogleMap'
import AddPlaceForm from '../components/AddPlaceForm'
import ReviewSystem from '../components/ReviewSystem'
import MerchantClaimForm from '../components/MerchantClaimForm'
import { Heart, MapPin, Plus, Building2 } from 'lucide-react'

function MapPageContent() {
  const searchParams = useSearchParams()
  const { smokingPlaces, favoritePlaces, addFavoritePlace, removeFavoritePlace, setSmokingPlaces } = useApp()
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)
  const [claimingPlace, setClaimingPlace] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    // Handle location filter from URL (from Explore button)
    const location = searchParams.get('location')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (location && lat && lng) {
      // Switch to map view when coming from Explore button
      setViewMode('map')
      // In future: filter smokingPlaces by location coordinates
    }
  }, [searchParams])

  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {/* View Toggle and Add Button */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
            }}
          >
            <Plus size={20} />
            Add Place
          </button>
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
              <GoogleMap 
                center={searchParams.get('lat') && searchParams.get('lng') ? {
                  lat: parseFloat(searchParams.get('lat')!),
                  lng: parseFloat(searchParams.get('lng')!),
                } : undefined}
                zoom={searchParams.get('lat') ? 15 : 13}
                places={smokingPlaces}
              />
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
                        <div key={place.id}>
                          <div
                            style={{
                              padding: '1.5rem',
                              backgroundColor: 'var(--bg-primary)',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '1rem',
                              marginBottom: '1rem',
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
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                              <button
                                onClick={() => setSelectedPlace(selectedPlace === place.id ? null : place.id)}
                                style={{
                                  padding: '0.5rem',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.85rem',
                                }}
                                title="View reviews"
                              >
                                💬
                              </button>
                              <button
                                onClick={() => setClaimingPlace({ id: place.id, name: place.name })}
                                style={{
                                  padding: '0.5rem',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                }}
                                title="Claim as merchant"
                              >
                                <Building2 size={18} />
                              </button>
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
                          </div>
                          {selectedPlace === place.id && (
                            <ReviewSystem
                              placeId={place.id}
                              placeName={place.name}
                              currentRating={place.rating}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Place Form Modal */}
        {showAddForm && (
          <AddPlaceForm
            onClose={() => setShowAddForm(false)}
            onSuccess={async () => {
              // Refresh places from API
              try {
                const response = await fetch('/api/places')
                const data = await response.json()
                setSmokingPlaces(data.places || [])
              } catch (error) {
                console.error('Failed to refresh places:', error)
              }
            }}
            initialLocation={
              searchParams.get('lat') && searchParams.get('lng')
                ? {
                    lat: parseFloat(searchParams.get('lat')!),
                    lng: parseFloat(searchParams.get('lng')!),
                  }
                : undefined
            }
          />
        )}

        {/* Merchant Claim Form Modal */}
        {claimingPlace && (
          <MerchantClaimForm
            placeId={claimingPlace.id}
            placeName={claimingPlace.name}
            onClose={() => setClaimingPlace(null)}
            onSuccess={() => {
              // Refresh or show success message
              setClaimingPlace(null)
            }}
          />
        )}
      </main>
    </>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapPageContent />
    </Suspense>
  )
}

