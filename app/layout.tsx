import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smoking App',
  description: 'A modern web application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

