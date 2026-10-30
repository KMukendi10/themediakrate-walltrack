
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Media Krate WallTrack',
  description: 'Internal wall management and tracking system for The Media Krate.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
