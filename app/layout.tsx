import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Smoking App - Find & Connect',
  description: 'Find smoking places, connect with others, and join the community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

