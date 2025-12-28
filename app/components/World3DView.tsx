'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '../contexts/AppContext'
import { MapPin, Search, Filter } from 'lucide-react'

interface Location {
  country: string
  city?: string
  district?: string
  place?: string
  lat: number
  lng: number
  spots: number
  shops: number
}

export default function World3DView() {
  const router = useRouter()
  const { smokingPlaces, setSmokingPlaces } = useApp()
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mock locations data - in real app, this would come from API
  const locations: Location[] = [
    { country: 'Greece', city: 'Athens', district: 'Kolonaki', lat: 37.9838, lng: 23.7275, spots: 12, shops: 5 },
    { country: 'Greece', city: 'Athens', district: 'Plaka', lat: 37.9715, lng: 23.7268, spots: 8, shops: 3 },
    { country: 'Greece', city: 'Thessaloniki', lat: 40.6401, lng: 22.9444, spots: 15, shops: 7 },
    { country: 'USA', city: 'New York', district: 'Manhattan', lat: 40.7128, lng: -74.0060, spots: 45, shops: 20 },
    { country: 'USA', city: 'Los Angeles', district: 'Hollywood', lat: 34.0522, lng: -118.2437, spots: 30, shops: 15 },
    { country: 'UK', city: 'London', district: 'Soho', lat: 51.5074, lng: -0.1278, spots: 25, shops: 12 },
  ]

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const filtered = locations.filter(loc => (
      loc.country.toLowerCase().includes(query) ||
      loc.city?.toLowerCase().includes(query) ||
      loc.district?.toLowerCase().includes(query)
    ))
    setFilteredLocations(filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location)
  }

  const handleExploreLocation = (location: Location) => {
    // Navigate to map page with location filter
    router.push(`/map?location=${encodeURIComponent(location.city || location.country)}&lat=${location.lat}&lng=${location.lng}`)
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Search and Filter Widget */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 10,
        display: 'flex',
        gap: '1rem',
      }}>
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search country, city, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
        </div>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-primary)',
        }}>
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* 3D Globe Canvas */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
        />
        
        {/* Placeholder for 3D globe - in production, use a library like react-globe.gl or three.js */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          <div style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #4a9eff, #1a5499)',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(74, 158, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
          }}>
            🌍
          </div>
          <p>Interactive 3D Globe</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Click on countries/cities to explore smoking spots
          </p>
        </div>
      </div>

      {/* Location List Widget */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 10,
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Locations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredLocations.map((location, idx) => (
            <div
              key={idx}
              onClick={() => handleLocationClick(location)}
              style={{
                padding: '1rem',
                backgroundColor: selectedLocation === location ? 'var(--accent)' : 'var(--bg-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                border: selectedLocation === location ? '2px solid var(--accent-hover)' : '1px solid var(--border)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPin size={18} />
                <strong style={{ color: selectedLocation === location ? 'white' : 'var(--text-primary)' }}>
                  {location.city ? `${location.city}, ${location.country}` : location.country}
                </strong>
              </div>
              {location.district && (
                <p style={{ fontSize: '0.9rem', color: selectedLocation === location ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {location.district}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: selectedLocation === location ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                <span>📍 {location.spots} spots</span>
                <span>🏪 {location.shops} shops</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Location Details Widget */}
      {selectedLocation && (
        <div style={{
          position: 'absolute',
          top: '5rem',
          right: '1rem',
          width: '300px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            {selectedLocation.city ? `${selectedLocation.city}, ${selectedLocation.country}` : selectedLocation.country}
          </h3>
          {selectedLocation.district && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              District: {selectedLocation.district}
            </p>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Smoking Spots:</span>
              <strong>{selectedLocation.spots}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shops:</span>
              <strong>{selectedLocation.shops}</strong>
            </div>
          </div>
          <button 
            onClick={() => selectedLocation && handleExploreLocation(selectedLocation)}
            style={{ width: '100%' }}
          >
            Explore {selectedLocation.city || selectedLocation.country}
          </button>
        </div>
      )}
    </div>
  )
}

