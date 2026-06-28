import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sri Varuni — Training',
  description: 'Staff Training Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="te">
      <body>{children}</body>
    </html>
  )
}
