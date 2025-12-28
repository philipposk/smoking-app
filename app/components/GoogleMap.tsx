'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '../contexts/AppContext'

interface GoogleMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  places?: Array<{ id: string; name: string; lat: number; lng: number; description?: string }>
}

export default function GoogleMap({ center, zoom = 13, places = [] }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const { smokingPlaces } = useApp()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !mapRef.current) return

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    } else {
      initializeMap()
    }

    function initializeMap() {
      if (!mapRef.current || !window.google) return

      const defaultCenter = center || { lat: 37.9838, lng: 23.7275 } // Athens default
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      })

      setMap(newMap)

      // Add markers for places
      const placesToShow = places.length > 0 ? places : smokingPlaces
      const newMarkers: google.maps.Marker[] = []

      placesToShow.forEach((place) => {
        const marker = new window.google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: newMap,
          title: place.name,
          animation: window.google.maps.Animation.DROP,
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 0.5rem; min-width: 200px;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${place.name}</h3>
              ${place.description ? `<p style="margin: 0; color: #666; font-size: 0.9rem;">${place.description}</p>` : ''}
              <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #999;">
                📍 ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}
              </p>
            </div>
          `,
        })

        marker.addListener('click', () => {
          infoWindow.open(newMap, marker)
        })

        newMarkers.push(marker)
      })

      setMarkers(newMarkers)

      // Fit bounds to show all markers
      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        newMarkers.forEach(marker => {
          if (marker.getPosition()) {
            bounds.extend(marker.getPosition()!)
          }
        })
        newMap.fitBounds(bounds)
      }
    }

    return () => {
      // Cleanup markers
      markers.forEach(marker => marker.setMap(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, center, zoom, places, smokingPlaces])

  if (!apiKey) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
      }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Google Maps API key not configured
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: typeof google
  }
}

