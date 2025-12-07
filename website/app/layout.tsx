import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

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
    <html lang="en">
      <body className="bg-gray-50">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
