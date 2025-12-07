import type { Metadata } from 'next'
import { Inter, Ubuntu_Mono } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const ubuntuMono = Ubuntu_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ubuntu-mono',
})

export const metadata: Metadata = {
  title: 'FDA CRL Analysis - Insights from Complete Response Letters',
  description: 'Analyzing patterns in FDA Complete Response Letters to understand drug approval outcomes',
  keywords: 'FDA, CRL, Complete Response Letter, drug approval, pharmaceutical research',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${ubuntuMono.variable}`}>
      <body className="bg-gray-50 font-sans antialiased">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
