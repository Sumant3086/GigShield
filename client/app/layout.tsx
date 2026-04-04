import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GigShield — Income Protection',
  description: 'AI-powered parametric income insurance for gig delivery workers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
