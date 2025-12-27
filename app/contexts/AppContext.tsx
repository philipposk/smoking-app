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
  const [smokingPlaces, setSmokingPlaces] = useState<SmokingPlace[]>([])
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

