'use client'

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Eye, Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import Fuse from 'fuse.js'

interface Document {
  file_hash: string
  drug_name: string
  application_number: string
  approval_status: string
  letter_date: string
  deficiency_categories: string[]
  enriched?: {
    openfda_brand_name?: string
  }
}

interface DocumentViewerLayoutProps {
  documents: Document[]
}

export default function DocumentViewerLayout({ documents }: DocumentViewerLayoutProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Setup Fuse.js for search
  const fuse = useMemo(() => {
    return new Fuse(documents, {
      keys: [
        { name: 'drug_name', weight: 2 },
        { name: 'application_number', weight: 2 },
        { name: 'enriched.openfda_brand_name', weight: 2 },
        { name: 'deficiency_categories', weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
    })
  }, [documents])

  // Filter documents based on search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents
    }
    return fuse.search(searchQuery).map((result) => result.item)
  }, [searchQuery, fuse, documents])

  const currentDoc = filteredDocs[currentIndex] || null

  const handleViewDocument = useCallback(
    (doc: Document) => {
      router.push(`/document-view/${doc.file_hash}`)
    },
    [router]
  )

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
    if (currentIndex < filteredDocs.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      scrollToCard(newIndex)
    }
  }, [currentIndex, filteredDocs.length, scrollToCard])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      scrollToCard(newIndex)
    }
  }, [currentIndex, scrollToCard])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'Enter') {
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

  // Reset index when search changes
  useEffect(() => {
    setCurrentIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [searchQuery])

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Two-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Full-Screen Snap Scroll Cards */}
        <div className="w-1/2 flex flex-col bg-[#0a0a0a]">
          {/* Search Bar - Minimal */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg
                  text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30
                  focus:border-white/30 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Snap Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto snap-y snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {filteredDocs.map((doc, index) => (
              <div
                key={doc.file_hash}
                data-card-index={index}
                className="snap-start h-full min-h-[calc(100vh-120px)] flex items-center justify-center p-8"
              >
                <div
                  onClick={() => setCurrentIndex(index)}
                  onDoubleClick={() => handleViewDocument(doc)}
                  className={`
                    relative w-full max-w-lg cursor-pointer transition-all duration-500
                    ${index === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-40'}
                  `}
                >
                  {/* Card */}
                  <div
                    className={`
                      relative rounded-2xl p-10 shadow-2xl
                      ${doc.approval_status === 'approved'
                        ? 'bg-gradient-to-br from-emerald-900/90 to-emerald-950/90 border border-emerald-500/30'
                        : 'bg-gradient-to-br from-rose-900/90 to-rose-950/90 border border-rose-500/30'}
                    `}
                  >
                    {/* Card Number (top right) */}
                    <div className="absolute top-4 right-4 text-white/20 text-sm font-mono">
                      {index + 1} / {filteredDocs.length}
                    </div>

                    {/* Main Content */}
                    <div className="text-center">
                      {/* Application Number - Hero */}
                      <div className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
                        {doc.application_number || 'N/A'}
                      </div>

                      {/* Drug Name */}
                      <div className="text-xl md:text-2xl text-white/70 font-light mb-6">
                        ({doc.enriched?.openfda_brand_name || doc.drug_name || 'Unknown Drug'})
                      </div>

                      {/* Status */}
                      <div
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                          ${doc.approval_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}
                        `}
                      >
                        {doc.approval_status === 'approved' ? '✓ Eventually Approved' : '✗ Not Approved'}
                      </div>

                      {/* Date */}
                      {doc.letter_date && (
                        <div className="mt-6 text-white/40 text-sm">
                          {doc.letter_date}
                        </div>
                      )}
                    </div>

                    {/* Deficiency Pills */}
                    {doc.deficiency_categories.length > 0 && (
                      <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {doc.deficiency_categories.slice(0, 4).map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1 bg-white/5 text-white/50 text-xs rounded-full capitalize"
                          >
                            {cat.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Search size={48} strokeWidth={1} className="mb-4" />
                <p className="text-lg">No documents found</p>
              </div>
            )}
          </div>

          {/* Navigation Hints */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronUp size={20} />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex >= filteredDocs.length - 1}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronDown size={20} />
              </button>
            </div>
            <div className="text-white/30 text-xs">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] ml-1">↓</kbd>
              <span className="ml-2">to navigate</span>
              <span className="mx-2">•</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Enter</kbd>
              <span className="ml-2">to open</span>
            </div>
          </div>
        </div>

        {/* Vertical Divider Line */}
        <div className="w-px bg-white/10 relative flex-shrink-0" />

        {/* Right Pane - Document Preview */}
        <div className="w-1/2 overflow-y-auto bg-[#fafafa]">
          {currentDoc ? (
            <div className="h-full flex flex-col">
              {/* Preview Header */}
              <div className="p-8 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                      {currentDoc.application_number}
                    </h2>
                    <p className="text-xl text-gray-500 mt-2 font-light">
                      {currentDoc.enriched?.openfda_brand_name ||
                        currentDoc.drug_name ||
                        'Unknown Drug'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDocument(currentDoc)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <Eye size={20} />
                    View CRL
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-8">
                <div className="space-y-8">
                  {/* Status */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Outcome
                    </h3>
                    <span
                      className={`
                        inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                        ${currentDoc.approval_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'}
                      `}
                    >
                      {currentDoc.approval_status === 'approved'
                        ? '✓ Drug Eventually Approved'
                        : '✗ Drug Not Approved'}
                    </span>
                  </div>

                  {/* Letter Date */}
                  {currentDoc.letter_date && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        CRL Date
                      </h3>
                      <p className="text-lg text-gray-700">{currentDoc.letter_date}</p>
                    </div>
                  )}

                  {/* Deficiency Categories */}
                  {currentDoc.deficiency_categories.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        Deficiency Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentDoc.deficiency_categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg capitalize"
                          >
                            {cat.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="p-8 border-t border-gray-100">
                <button
                  onClick={() => handleViewDocument(currentDoc)}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                >
                  Open Interactive Document Viewer →
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <FileText size={48} strokeWidth={1} className="mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Document Selected</h3>
              <p className="text-center max-w-sm text-gray-400 text-sm">
                Scroll through the cards on the left to browse CRLs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
