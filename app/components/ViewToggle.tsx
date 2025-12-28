'use client'

import { List, Map as MapIcon, Globe } from 'lucide-react'

export type ViewMode = 'list' | 'map' | 'world'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views: { mode: ViewMode; icon: any; label: string }[] = [
    { mode: 'list', icon: List, label: 'List' },
    { mode: 'map', icon: MapIcon, label: 'Map' },
    { mode: 'world', icon: Globe, label: '3D World' },
  ]

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      backgroundColor: 'var(--bg-secondary)',
      padding: '0.5rem',
      borderRadius: '12px',
      border: '1px solid var(--border)',
    }}>
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: currentView === mode ? 'var(--accent)' : 'transparent',
            color: currentView === mode ? 'white' : 'var(--text-primary)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: currentView === mode ? 'bold' : 'normal',
          }}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

