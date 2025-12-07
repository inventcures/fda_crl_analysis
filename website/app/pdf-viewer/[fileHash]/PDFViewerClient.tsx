'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'

// Lock body scroll when component mounts
function useScrollLock() {
  useEffect(() => {
    // Save original styles
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalBodyPosition = document.body.style.position
    const originalBodyWidth = document.body.style.width
    const originalBodyHeight = document.body.style.height

    // Find elements to hide/lock
    const nav = document.querySelector('nav')
    const main = document.querySelector('main')
    const footer = document.querySelector('footer')

    const originalNavDisplay = nav ? (nav as HTMLElement).style.display : ''
    const originalMainOverflow = main ? (main as HTMLElement).style.overflow : ''
    const originalMainHeight = main ? (main as HTMLElement).style.height : ''
    const originalFooterDisplay = footer ? (footer as HTMLElement).style.display : ''

    // Lock scroll on root elements with position: fixed for maximum effectiveness
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.overscrollBehavior = 'none' // Prevent bounce
    document.documentElement.style.overscrollBehavior = 'none' // Prevent bounce on html too

    // Hide Navigation
    if (nav) {
      (nav as HTMLElement).style.display = 'none'
    }

    // CRITICAL FIX: Lock main element to prevent scroll propagation
    if (main) {
      const mainElement = main as HTMLElement
      mainElement.style.overflow = 'hidden'
      mainElement.style.height = '100vh'
    }

    // Hide Footer
    if (footer) {
      (footer as HTMLElement).style.display = 'none'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.position = originalBodyPosition
      document.body.style.width = originalBodyWidth
      document.body.style.height = originalBodyHeight
      document.body.style.overscrollBehavior = ''
      document.documentElement.style.overscrollBehavior = ''

      if (nav) {
        (nav as HTMLElement).style.display = originalNavDisplay
      }

      if (main) {
        const mainElement = main as HTMLElement
        mainElement.style.overflow = originalMainOverflow
        mainElement.style.height = originalMainHeight
      }

      if (footer) {
        (footer as HTMLElement).style.display = originalFooterDisplay
      }
    }
  }, [])
}

// Dynamically import PDFViewer with ssr disabled to avoid Node.js build errors
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fda-blue"></div>
    </div>
  ),
})

interface PDFViewerClientProps {
  fileHash: string
}

export default function PDFViewerClient({ fileHash }: PDFViewerClientProps) {
  // Lock body scroll when this component is mounted
  useScrollLock()

  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || undefined
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1

  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Load CRL metadata from search data
  useEffect(() => {
    fetch('/data/search_crls.json')
      .then(res => res.json())
      .then(data => {
        const crl = data.find((d: any) => d.file_hash === fileHash)
        setMetadata(crl)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading metadata:', err)
        setLoading(false)
      })
  }, [fileHash])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fda-blue"></div>
      </div>
    )
  }

  const pdfUrl = `/pdfs/${fileHash}.pdf`

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white h-[100dvh] overscroll-none touch-none">
      {/* Header with metadata - Fixed */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 text-fda-blue hover:underline"
            >
              <ArrowLeft size={20} />
              Back to Search
            </Link>

            {metadata && (
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-lg font-semibold text-gray-900">
                  {metadata.drug_name || metadata.application_number || 'CRL Document'}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {metadata.sponsor_name && <span>{metadata.sponsor_name}</span>}
                  {metadata.letter_date && <span>• {metadata.letter_date}</span>}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${metadata.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {metadata.approval_status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FDA Copyright Disclaimer - Fixed */}
      <div className="bg-blue-50 border-y border-blue-200 px-6 py-3 flex-shrink-0">
        <div className="container mx-auto max-w-7xl">
          <p className="text-sm text-blue-900 font-medium text-center">
            <span className="font-bold">📄 FDA Copyright Notice:</span> These files are © U.S. Food and Drug Administration. All rights reserved.
            Documents are provided here as a service to the drug discovery and research community.
          </p>
        </div>
      </div>

      {/* PDF Viewer - Scrollable Area */}
      <div className="flex-1 min-h-0 relative">
        <ErrorBoundary>
          <PDFViewer
            fileUrl={pdfUrl}
            fileName={metadata?.original_filename || `${fileHash}.pdf`}
            searchQuery={searchQuery}
            initialPage={page}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}
