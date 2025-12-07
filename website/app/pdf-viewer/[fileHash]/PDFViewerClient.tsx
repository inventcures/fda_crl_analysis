'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
    <div className="h-screen flex flex-col">
      {/* Header with metadata */}
      <div className="bg-white border-b border-gray-200 p-4">
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
                    className={`px-2 py-1 rounded-full text-xs ${
                      metadata.approval_status === 'approved'
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

      {/* PDF Viewer */}
      <div className="flex-1">
        <PDFViewer
          fileUrl={pdfUrl}
          searchQuery={searchQuery}
          initialPage={page}
        />
      </div>
    </div>
  )
}
