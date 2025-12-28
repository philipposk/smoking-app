'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SmokingPlace {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
  imageUrl?: string
  rating?: number
}

interface User {
  id: string
  name: string
  email: string
  age: number
  favoritePlaces: string[]
}

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  smokingPlaces: SmokingPlace[]
  setSmokingPlaces: (places: SmokingPlace[]) => void
  favoritePlaces: SmokingPlace[]
  addFavoritePlace: (place: SmokingPlace) => void
  removeFavoritePlace: (placeId: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Sample data for testing
  const [smokingPlaces, setSmokingPlaces] = useState<SmokingPlace[]>([
    { id: '1', name: 'Kolonaki Square', lat: 37.9838, lng: 23.7275, description: 'Popular outdoor spot in Athens', rating: 4.5 },
    { id: '2', name: 'Plaka District', lat: 37.9715, lng: 23.7268, description: 'Historic area with great views', rating: 4.2 },
    { id: '3', name: 'Thessaloniki Waterfront', lat: 40.6401, lng: 22.9444, description: 'Beautiful seaside location', rating: 4.7 },
  ])
  const [favoritePlaces, setFavoritePlaces] = useState<SmokingPlace[]>([])

  const addFavoritePlace = (place: SmokingPlace) => {
    if (!favoritePlaces.find(p => p.id === place.id)) {
      setFavoritePlaces([...favoritePlaces, place])
    }
  }

  const removeFavoritePlace = (placeId: string) => {
    setFavoritePlaces(favoritePlaces.filter(p => p.id !== placeId))
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        smokingPlaces,
        setSmokingPlaces,
        favoritePlaces,
        addFavoritePlace,
        removeFavoritePlace,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

