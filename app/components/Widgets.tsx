'use client'

import { useState } from 'react'
import { Search, Filter, TrendingUp, Clock, Star, MapPin, Heart } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

// Quick Search Widget
export function QuickSearchWidget() {
  const [query, setQuery] = useState('')

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Search size={20} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.1rem' }}>Quick Search</h3>
      </div>
      <input
        type="text"
        placeholder="Search places, cities, or districts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '1rem',
        }}
      />
    </div>
  )
}

// Filters Widget
export function FiltersWidget() {
  const [filters, setFilters] = useState({
    outdoor: false,
    indoor: false,
    shops: false,
    spots: false,
    rating: 'all',
  })

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Filter size={20} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.1rem' }}>Filters</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={filters.outdoor}
              onChange={(e) => setFilters({ ...filters, outdoor: e.target.checked })}
            />
            <span>Outdoor</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={filters.indoor}
              onChange={(e) => setFilters({ ...filters, indoor: e.target.checked })}
            />
            <span>Indoor</span>
          </label>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={filters.shops}
              onChange={(e) => setFilters({ ...filters, shops: e.target.checked })}
            />
            <span>Shops</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={filters.spots}
              onChange={(e) => setFilters({ ...filters, spots: e.target.checked })}
            />
            <span>Spots</span>
          </label>
        </div>
        <div>
          <label style={{ marginBottom: '0.5rem', display: 'block' }}>Min Rating:</label>
          <select
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Trending Widget
export function TrendingWidget() {
  const trending = [
    { name: 'Kolonaki, Athens', change: '+12%', spots: 15 },
    { name: 'Plaka, Athens', change: '+8%', spots: 10 },
    { name: 'Thessaloniki Center', change: '+15%', spots: 20 },
  ]

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.1rem' }}>Trending Places</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {trending.map((place, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{place.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {place.spots} spots
              </div>
            </div>
            <div style={{ color: '#4ade80', fontWeight: 'bold' }}>{place.change}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Quick Actions Widget
export function QuickActionsWidget() {
  const { favoritePlaces } = useApp()

  const actions = [
    { icon: MapPin, label: 'Near Me', action: () => console.log('Near me') },
    { icon: Heart, label: 'Favorites', count: favoritePlaces.length, action: () => console.log('Favorites') },
    { icon: Star, label: 'Top Rated', action: () => console.log('Top rated') },
    { icon: Clock, label: 'Recent', action: () => console.log('Recent') },
  ]

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '1.5rem',
    }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {actions.map((action, idx) => {
          const Icon = action.icon
          return (
            <button
              key={idx}
              onClick={action.action}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
              }}
            >
              <Icon size={24} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem' }}>{action.label}</span>
              {action.count !== undefined && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{action.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

