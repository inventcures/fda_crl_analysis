'use client'

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Eye, ChevronUp, ChevronDown, Download, ExternalLink } from 'lucide-react'

interface CRLDocument {
  file_hash: string
  drug_name?: string
  application_number?: string
  sponsor_name?: string
  therapeutic_area?: string
  approval_status?: string
  letter_date?: string
  deficiency_categories?: string[]
  snippet?: string
  page_count?: number
  has_safety_concerns?: boolean
  has_efficacy_concerns?: boolean
  requests_new_trial?: boolean
  original_filename?: string
  enriched?: {
    openfda_brand_name?: string
  }
  [key: string]: any
}

// Accept either wrapped results or plain documents
type SearchResult = { item: CRLDocument; score?: number; matches?: readonly any[] } | CRLDocument

interface SearchResultsStackProps {
  results: SearchResult[]
  isSearching: boolean
  query: string
}

// Helper to normalize result format
function normalizeResult(result: SearchResult): CRLDocument {
  if ('item' in result && result.item) {
    return result.item as CRLDocument
  }
  return result as CRLDocument
}

export default function SearchResultsStack({ results, isSearching, query }: SearchResultsStackProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const documents = useMemo(() => results.map(normalizeResult), [results])
  const currentDoc = documents[currentIndex] || null

  // Scroll to specific card
  const scrollToCard = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    const cards = container.querySelectorAll('[data-card-index]')
    const targetCard = cards[index] as HTMLElement
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Navigate to next/previous card
  const goToNext = useCallback(() => {
    if (currentIndex < documents.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      scrollToCard(newIndex)
    }
  }, [currentIndex, documents.length, scrollToCard])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      scrollToCard(newIndex)
    }
  }, [currentIndex, scrollToCard])

  // Open document viewer with search origin
  const handleViewDocument = useCallback((doc: CRLDocument) => {
    const params = new URLSearchParams()
    params.set('from', 'search')
    if (query) params.set('q', query)
    router.push(`/document-view/${doc.file_hash}?${params.toString()}`)
  }, [router, query])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'o' || e.key === 'O' || e.key === 'Enter') {
        e.preventDefault()
        if (currentDoc) {
          handleViewDocument(currentDoc)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, currentDoc, handleViewDocument])

  // Handle scroll snap detection
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const cards = container.querySelectorAll('[data-card-index]')
      const containerRect = container.getBoundingClientRect()

      let closestIndex = 0
      let closestDistance = Infinity

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect()
        const cardCenter = cardRect.top + cardRect.height / 2
        const containerCenter = containerRect.top + containerRect.height / 2
        const distance = Math.abs(cardCenter - containerCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      if (closestIndex !== currentIndex) {
        setCurrentIndex(closestIndex)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentIndex])

  // Reset index when results change
  useEffect(() => {
    setCurrentIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [results])

  if (!isSearching && !query) {
    return null
  }

  if (documents.length === 0 && query) {
    return (
      <div className="text-center py-12 border border-dashed border-border-light rounded-sm bg-subtle">
        <p className="text-xl text-text-secondary font-light">No CRLs found matching your search.</p>
        <p className="text-sm text-text-secondary mt-2 font-mono">
          Try different keywords or check your spelling.
        </p>
      </div>
    )
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <div className="bg-[#0a0a0a] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
      <div className="flex h-full">
        {/* Left Pane - Card Stack */}
        <div className="w-1/2 flex flex-col border-r border-white/10">
          {/* Snap Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto snap-y snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {documents.map((doc, index) => (
              <div
                key={doc.file_hash}
                data-card-index={index}
                className="snap-start h-full min-h-[400px] flex items-center justify-center p-6"
              >
                <div
                  onClick={() => handleViewDocument(doc)}
                  className={`
                    relative w-full max-w-md cursor-pointer transition-all duration-500
                    ${index === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-40'}
                  `}
                >
                  {/* Card */}
                  <div
                    className={`
                      relative rounded-2xl p-8 shadow-2xl
                      ${doc.approval_status === 'approved'
                        ? 'bg-gradient-to-br from-emerald-900/90 to-emerald-950/90 border border-emerald-500/30'
                        : 'bg-gradient-to-br from-rose-900/90 to-rose-950/90 border border-rose-500/30'}
                    `}
                  >
                    {/* Card Number */}
                    <div className="absolute top-3 right-3 text-white/20 text-xs font-mono">
                      {index + 1} / {documents.length}
                    </div>

                    {/* Main Content */}
                    <div className="text-center">
                      {/* Application Number */}
                      <div className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                        {doc.application_number || 'N/A'}
                      </div>

                      {/* Drug Name */}
                      <div className="text-lg text-white/70 font-light mb-4">
                        ({doc.enriched?.openfda_brand_name || doc.drug_name || 'Unknown Drug'})
                      </div>

                      {/* Status */}
                      <div
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                          ${doc.approval_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}
                        `}
                      >
                        {doc.approval_status === 'approved' ? '✓ Eventually Approved' : '✗ Not Approved'}
                      </div>

                      {/* Date */}
                      {doc.letter_date && (
                        <div className="mt-4 text-white/40 text-xs">
                          {doc.letter_date}
                        </div>
                      )}
                    </div>

                    {/* Deficiency Pills */}
                    {doc.deficiency_categories && doc.deficiency_categories.length > 0 && (
                      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                        {doc.deficiency_categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 bg-white/5 text-white/50 text-[10px] rounded-full capitalize"
                          >
                            {cat.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {doc.deficiency_categories.length > 3 && (
                          <span className="px-2 py-0.5 text-white/30 text-[10px]">
                            +{doc.deficiency_categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Hints */}
          <div className="p-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronUp size={18} />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex >= documents.length - 1}
                className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <div className="text-white/30 text-[10px]">
              <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">↑↓</kbd>
              <span className="ml-1">navigate</span>
              <span className="mx-2">•</span>
              <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">o</kbd>
              <span className="ml-1">open</span>
            </div>
          </div>
        </div>

        {/* Right Pane - Document Preview */}
        <div className="w-1/2 overflow-y-auto bg-[#fafafa]">
          {currentDoc ? (
            <div className="h-full flex flex-col">
              {/* Preview Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      {currentDoc.application_number}
                    </h2>
                    <p className="text-lg text-gray-500 mt-1 font-light">
                      {currentDoc.enriched?.openfda_brand_name || currentDoc.drug_name || 'Unknown Drug'}
                    </p>
                    {currentDoc.sponsor_name && currentDoc.sponsor_name !== 'Unknown' && (
                      <p className="text-sm text-gray-400 mt-1">{currentDoc.sponsor_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewDocument(currentDoc)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm"
                  >
                    <Eye size={18} />
                    View CRL
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Status */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Outcome
                  </h3>
                  <span
                    className={`
                      inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                      ${currentDoc.approval_status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'}
                    `}
                  >
                    {currentDoc.approval_status === 'approved'
                      ? '✓ Eventually Approved'
                      : '✗ Not Approved'}
                  </span>
                </div>

                {/* Snippet */}
                {currentDoc.snippet && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Excerpt
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-3">
                      {currentDoc.snippet}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  {currentDoc.therapeutic_area && currentDoc.therapeutic_area !== 'unknown' && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                        Therapeutic Area
                      </h3>
                      <span className="text-sm text-gray-700 capitalize">{currentDoc.therapeutic_area}</span>
                    </div>
                  )}
                  {currentDoc.letter_date && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                        CRL Date
                      </h3>
                      <span className="text-sm text-gray-700">{currentDoc.letter_date}</span>
                    </div>
                  )}
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-2">
                  {currentDoc.has_safety_concerns && (
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs border border-red-100">
                      Safety Concerns
                    </span>
                  )}
                  {currentDoc.has_efficacy_concerns && (
                    <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs border border-orange-100">
                      Efficacy Concerns
                    </span>
                  )}
                  {currentDoc.requests_new_trial && (
                    <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs border border-purple-100">
                      New Trial Required
                    </span>
                  )}
                </div>

                {/* Deficiency Categories */}
                {currentDoc.deficiency_categories && currentDoc.deficiency_categories.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Deficiencies
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {currentDoc.deficiency_categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize"
                        >
                          {cat.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => handleViewDocument(currentDoc)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Open Interactive Viewer
                </button>
                <a
                  href={`/pdfs/${currentDoc.file_hash}.pdf`}
                  download={currentDoc.original_filename || `${currentDoc.file_hash}.pdf`}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
              <FileText size={40} strokeWidth={1} className="mb-3 opacity-50" />
              <h3 className="text-base font-medium text-gray-500 mb-1">No Document Selected</h3>
              <p className="text-center max-w-xs text-gray-400 text-sm">
                Scroll through the cards to browse
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
