
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WallTrack',
  description: 'A prototype for managing advertising walls and field operations.',
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
