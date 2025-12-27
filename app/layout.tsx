import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppProvider } from './contexts/AppContext'

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
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

