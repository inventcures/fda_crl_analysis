'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import InteractivePDFViewer from './InteractivePDFViewer'

interface Highlight {
  page: number
  rect: number[]
  text: string
  category: string
  type: string
  page_width: number
  page_height: number
}

interface CRLData {
  file_hash: string
  drug_name: string
  application_number: string
  approval_status: string
  letter_date: string
  deficiency_categories: string[]
}

interface DocumentViewerWithNavProps {
  crl: CRLData
  highlights: Highlight[]
}

export default function DocumentViewerWithNav({ crl, highlights }: DocumentViewerWithNavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get('from')
  const query = searchParams.get('q')

  const handleBack = useCallback(() => {
    if (from === 'search') {
      // Go back to search with query preserved
      if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      } else {
        router.push('/search')
      }
    } else if (from === 'document-view') {
      // Go back to document-view (filters are handled via URL if we add them later)
      router.push('/document-view')
    } else {
      // Default: try browser back, or go to document-view
      router.back()
    }
  }, [from, query, router])

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleBack])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Back Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
          >
            <ArrowLeft size={16} />
            Back{from === 'search' ? ' to Search' : from === 'document-view' ? ' to Documents' : ''}
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="text-white/50 text-sm">
            <span className="font-mono text-white/80">{crl.application_number}</span>
            <span className="mx-2">•</span>
            <span>{crl.drug_name || 'Unknown Drug'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
          <span>to go back</span>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <InteractivePDFViewer
          fileUrl={`/pdfs/${crl.file_hash}.pdf`}
          fileName={`${crl.application_number}_CRL.pdf`}
          highlights={highlights}
        />
      </div>
    </div>
  )
}
