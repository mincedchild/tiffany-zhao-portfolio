import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const handwriting = localFont({
  src: './fonts/t33fs-handwriting.ttf',
  variable: '--font-handwriting',
  display: 'swap',
})

const valleySans = localFont({
  src: './fonts/ValleySans-Variable.ttf',
  variable: '--font-valley-sans',
  display: 'swap',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Tiffany Zhao — Illustration & Tattoo',
  description:
    'The portfolio of Tiffany Zhao — illustration, sketchbook studies, and tattoo flash.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f3ea',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${handwriting.variable} ${valleySans.variable} light bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
