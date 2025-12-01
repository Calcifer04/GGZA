import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GGZA - South African Gaming Quiz Hub',
  description: 'Join the ultimate South African gaming community. Weekly quiz nights, cash prizes, and competitive leaderboards for CS2, Valorant, FIFA, Fortnite, and Apex Legends.',
  keywords: ['gaming', 'quiz', 'South Africa', 'esports', 'CS2', 'Valorant', 'FIFA', 'Fortnite', 'Apex Legends', 'cash prizes'],
  authors: [{ name: 'GGZA' }],
  openGraph: {
    title: 'GGZA - South African Gaming Quiz Hub',
    description: 'Weekly gaming quizzes with cash prizes. Join the SA gaming community.',
    type: 'website',
    locale: 'en_ZA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GGZA - South African Gaming Quiz Hub',
    description: 'Weekly gaming quizzes with cash prizes. Join the SA gaming community.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FFD700',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

