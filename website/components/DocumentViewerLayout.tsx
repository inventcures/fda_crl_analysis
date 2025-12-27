'use client'

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Eye, EyeOff, Search, X, ChevronUp, ChevronDown, ArrowLeft, Download, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react'
import Fuse from 'fuse.js'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

interface Highlight {
  page: number
  rect: number[]
  trigger_rect?: number[]
  text: string
  category: string
  type: string
  reason?: string
  sentiment?: string
  page_width: number
  page_height: number
}

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

type ViewMode = 'cards' | 'pdf'

// Highlight category colors (matching InteractivePDFViewer)
const HIGHLIGHT_COLORS: Record<string, { color: string, solid: string, shortLabel: string }> = {
  'critical_efficacy': { color: 'rgba(255, 100, 150, 0.45)', solid: '#ff6496', shortLabel: 'efficacy!' },
  'safety_alert': { color: 'rgba(255, 80, 80, 0.45)', solid: '#ff5050', shortLabel: 'safety' },
  'clinical_design': { color: 'rgba(255, 165, 0, 0.45)', solid: '#ffa500', shortLabel: 'design' },
  'cmc_quality': { color: 'rgba(255, 255, 0, 0.5)', solid: '#ffff00', shortLabel: 'CMC' },
  'labeling_negotiation': { color: 'rgba(200, 150, 255, 0.45)', solid: '#c896ff', shortLabel: 'labeling' },
  'approval_strength': { color: 'rgba(100, 255, 150, 0.45)', solid: '#64ff96', shortLabel: 'good!' },
  'mitigating_factor': { color: 'rgba(100, 200, 255, 0.45)', solid: '#64c8ff', shortLabel: 'mitigating' },
  'other': { color: 'rgba(180, 180, 180, 0.4)', solid: '#b4b4b4', shortLabel: 'note' }
}

interface DocumentViewerLayoutProps {
  documents: Document[]
}

// Define available filters
const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'unapproved', label: 'Rejected' },
] as const

const CATEGORY_FILTERS = [
  { id: 'oncology_specific', label: 'Oncology', color: 'bg-purple-500' },
  { id: 'safety', label: 'Safety', color: 'bg-red-500' },
  { id: 'efficacy', label: 'Efficacy', color: 'bg-orange-500' },
  { id: 'cmc_manufacturing', label: 'CMC', color: 'bg-yellow-500' },
  { id: 'clinical_trial_design', label: 'Trial Design', color: 'bg-blue-500' },
  { id: 'statistical', label: 'Statistical', color: 'bg-cyan-500' },
  { id: 'bioequivalence', label: 'Bioequiv.', color: 'bg-teal-500' },
] as const

export default function DocumentViewerLayout({ documents }: DocumentViewerLayoutProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'unapproved'>('all')
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // PDF viewing state
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [pdfNumPages, setPdfNumPages] = useState<number>(0)
  const [pdfScale, setPdfScale] = useState(1.0)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [showHighlights, setShowHighlights] = useState(true)
  const [highlightsLoading, setHighlightsLoading] = useState(false)
  const pdfScrollRef = useRef<HTMLDivElement>(null)

  // Group highlights by page
  const highlightsByPage = useMemo(() => {
    const grouped: Record<number, Highlight[]> = {}
    highlights.forEach((h) => {
      if (!grouped[h.page]) grouped[h.page] = []
      grouped[h.page].push(h)
    })
    return grouped
  }, [highlights])

  // Toggle category filter
  const toggleCategory = (categoryId: string) => {
    setCategoryFilters(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
  }

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

  // Filter documents based on search, status, and categories
  const filteredDocs = useMemo(() => {
    let results = documents

    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(doc => doc.approval_status === statusFilter)
    }

    // Apply category filters (OR logic - match any selected category)
    if (categoryFilters.length > 0) {
      results = results.filter(doc =>
        categoryFilters.some(cat => doc.deficiency_categories.includes(cat))
      )
    }

    // Apply search query
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery).map(r => r.item)
      results = results.filter(doc => searchResults.some(sr => sr.file_hash === doc.file_hash))
    }

    return results
  }, [searchQuery, fuse, documents, statusFilter, categoryFilters])

  const currentDoc = filteredDocs[currentIndex] || null

  const handleViewDocument = useCallback(
    (doc: Document) => {
      router.push(`/document-view/${doc.file_hash}?from=document-view`)
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

  // Fetch highlights for a document
  const fetchHighlights = useCallback(async (fileHash: string) => {
    setHighlightsLoading(true)
    try {
      const response = await fetch('/data/crl_highlights.json')
      if (response.ok) {
        const data = await response.json()
        if (data[fileHash]?.highlights) {
          setHighlights(data[fileHash].highlights)
        } else {
          setHighlights([])
        }
      }
    } catch (error) {
      console.error('Failed to load highlights:', error)
      setHighlights([])
    } finally {
      setHighlightsLoading(false)
    }
  }, [])

  // PDF viewing functions
  const openPdfView = useCallback((docIndex?: number) => {
    // If docIndex provided, set it first
    const idx = typeof docIndex === 'number' ? docIndex : currentIndex
    if (typeof docIndex === 'number') {
      setCurrentIndex(docIndex)
    }
    setViewMode('pdf')
    setPdfNumPages(0) // Reset page count for new document

    // Fetch highlights for the document
    const doc = filteredDocs[idx]
    if (doc) {
      fetchHighlights(doc.file_hash)
    }
  }, [currentIndex, filteredDocs, fetchHighlights])

  const closePdfView = useCallback(() => {
    setViewMode('cards')
  }, [])

  const zoomIn = useCallback(() => {
    setPdfScale(prev => Math.min(2.5, prev + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setPdfScale(prev => Math.max(0.5, prev - 0.2))
  }, [])

  // Get PDF URL for current document
  const currentPdfUrl = useMemo(() => {
    if (!currentDoc) return null
    return `/pdfs/${currentDoc.file_hash}.pdf`
  }, [currentDoc])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in search input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      if (viewMode === 'pdf') {
        // PDF view keyboard shortcuts
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault()
          closePdfView()
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          zoomIn()
        } else if (e.key === '-') {
          e.preventDefault()
          zoomOut()
        }
      } else {
        // Card view keyboard shortcuts
        if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault()
          goToNext()
        } else if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault()
          goToPrev()
        } else if (e.key === 'o' || e.key === 'O' || e.key === 'Enter') {
          e.preventDefault()
          if (currentDoc) {
            openPdfView()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, goToNext, goToPrev, currentDoc, openPdfView, closePdfView, zoomIn, zoomOut])

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

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [searchQuery, statusFilter, categoryFilters])

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Two-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Cards or PDF View */}
        <div className="w-1/2 flex flex-col bg-[#0a0a0a]">
          {viewMode === 'pdf' && currentDoc ? (
            /* PDF Inline View */
            <>
              {/* PDF Toolbar */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={closePdfView}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <div className="h-4 w-px bg-white/10" />
                  <span className="text-white/50 text-sm font-mono">
                    {currentDoc.application_number}
                  </span>
                  <span className="text-white/30 text-sm">
                    {currentDoc.enriched?.openfda_brand_name || currentDoc.drug_name || ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                    <button
                      onClick={zoomOut}
                      className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      title="Zoom Out (-)"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[10px] font-mono w-10 text-center text-white/40">
                      {Math.round(pdfScale * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      title="Zoom In (+)"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                  {/* Highlights Toggle */}
                  <button
                    onClick={() => setShowHighlights(!showHighlights)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      showHighlights
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                    title={showHighlights ? 'Hide Annotations' : 'Show Annotations'}
                  >
                    {showHighlights ? <Eye size={12} /> : <EyeOff size={12} />}
                    {highlights.length > 0 && (
                      <span className="font-mono">{highlights.length}</span>
                    )}
                  </button>
                  {/* Open in full viewer */}
                  <button
                    onClick={() => handleViewDocument(currentDoc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all text-xs"
                    title="Open with Analysis"
                  >
                    <ExternalLink size={12} />
                    Full View
                  </button>
                  {/* Download */}
                  <a
                    href={currentPdfUrl || '#'}
                    download={`CRL-${currentDoc.application_number}.pdf`}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>

              {/* PDF Content with Scroll */}
              <div
                ref={pdfScrollRef}
                className="flex-1 overflow-y-auto bg-slate-800/50 p-6"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a5568 #1a202c' }}
              >
                <PDFDocument
                  file={currentPdfUrl}
                  onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                  loading={
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                      <div className="w-12 h-12 border-4 border-white/10 border-t-white/50 rounded-full animate-spin"></div>
                      <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Loading PDF...</p>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center py-32 text-rose-400">
                      <FileText size={48} className="mb-4 opacity-50" />
                      <p className="text-sm">Failed to load PDF</p>
                    </div>
                  }
                  className="flex flex-col items-center gap-4"
                >
                  {Array.from(new Array(pdfNumPages), (_, index) => {
                    const pageNum = index + 1
                    const pageHighlights = highlightsByPage[pageNum] || []
                    const pageWidth = pageHighlights[0]?.page_width || 612
                    const pageHeight = pageHighlights[0]?.page_height || 792

                    return (
                      <div key={`page_${pageNum}`} className="flex">
                        {/* PDF Page with Highlights */}
                        <div className="relative shadow-2xl rounded-l-sm overflow-hidden bg-white">
                          <Page
                            pageNumber={pageNum}
                            scale={pdfScale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="bg-white"
                          />

                          {/* Highlight Overlay */}
                          {showHighlights && pageHighlights.length > 0 && (
                            <svg
                              className="absolute top-0 left-0 pointer-events-none"
                              style={{
                                width: `${pageWidth * pdfScale}px`,
                                height: `${pageHeight * pdfScale}px`,
                                zIndex: 10
                              }}
                              viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                              preserveAspectRatio="none"
                            >
                              {pageHighlights.map((h, i) => {
                                const config = HIGHLIGHT_COLORS[h.category] || HIGHLIGHT_COLORS['other']
                                return (
                                  <g key={i}>
                                    {/* Highlight rectangle */}
                                    <rect
                                      x={h.rect[0] - 2}
                                      y={h.rect[1] - 1}
                                      width={h.rect[2] + 4}
                                      height={h.rect[3] + 2}
                                      rx={2}
                                      fill={config.color}
                                      style={{ mixBlendMode: 'multiply' }}
                                    />
                                    {/* Underline accent */}
                                    {h.trigger_rect && (
                                      <line
                                        x1={h.trigger_rect[0]}
                                        y1={h.trigger_rect[1] + h.trigger_rect[3] + 1}
                                        x2={h.trigger_rect[0] + h.trigger_rect[2]}
                                        y2={h.trigger_rect[1] + h.trigger_rect[3] + 1}
                                        stroke={config.solid}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                      />
                                    )}
                                    {/* Line to margin */}
                                    <path
                                      d={`M ${h.rect[0] + h.rect[2] + 5} ${h.rect[1] + h.rect[3]/2}
                                          L ${pageWidth - 10} ${h.rect[1] + h.rect[3]/2}`}
                                      stroke={config.solid}
                                      strokeWidth={1.5}
                                      strokeDasharray="3,3"
                                      fill="none"
                                      opacity={0.6}
                                    />
                                  </g>
                                )
                              })}
                            </svg>
                          )}
                        </div>

                        {/* Margin Notes Column */}
                        {showHighlights && pageHighlights.length > 0 && (
                          <div
                            className="relative bg-amber-50/90 border-l-2 border-amber-300 shadow-inner"
                            style={{
                              width: `${140 * pdfScale}px`,
                              minHeight: `${pageHeight * pdfScale}px`
                            }}
                          >
                            {/* Ruled lines effect */}
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #d97706 24px)',
                                backgroundSize: '100% 24px'
                              }}
                            />

                            {/* Margin annotations */}
                            {pageHighlights.map((h, i) => {
                              const config = HIGHLIGHT_COLORS[h.category] || HIGHLIGHT_COLORS['other']
                              const yPos = (h.rect[1] / pageHeight) * 100

                              return (
                                <div
                                  key={i}
                                  className="absolute left-2 right-2"
                                  style={{
                                    top: `${Math.min(yPos, 90)}%`,
                                    transform: `rotate(${(i % 3 - 1) * 1.5}deg)`
                                  }}
                                >
                                  <div
                                    className="p-1.5 font-handwriting font-bold"
                                    style={{
                                      fontSize: `${14 * pdfScale}px`,
                                      color: config.solid,
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {config.shortLabel}
                                    {h.type === 'risk' && ' ⚠'}
                                    {h.type === 'strength' && ' ✓'}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </PDFDocument>

                {/* Page count indicator */}
                {pdfNumPages > 0 && (
                  <div className="text-center mt-6 text-white/30 text-xs">
                    {pdfNumPages} page{pdfNumPages !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* PDF Navigation Hints */}
              <div className="p-3 border-t border-white/10 flex items-center justify-center">
                <div className="text-white/30 text-xs">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
                  <span className="ml-2">to go back</span>
                  <span className="mx-3">•</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">+</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] ml-1">-</kbd>
                  <span className="ml-2">to zoom</span>
                </div>
              </div>
            </>
          ) : (
            /* Card List View */
            <>
              {/* Search & Filters */}
              <div className="p-4 border-b border-white/10 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by drug name, number..."
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

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs uppercase tracking-wider">Status:</span>
                  <div className="flex gap-1">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setStatusFilter(filter.id as typeof statusFilter)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${statusFilter === filter.id
                            ? filter.id === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : filter.id === 'unapproved'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-white/20 text-white border border-white/30'
                            : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70'}
                        `}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-start gap-2">
                  <span className="text-white/40 text-xs uppercase tracking-wider pt-1.5">Issues:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_FILTERS.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`
                          px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5
                          ${categoryFilters.includes(cat.id)
                            ? `${cat.color} text-white shadow-lg`
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'}
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${categoryFilters.includes(cat.id) ? 'bg-white' : cat.color}`} />
                        {cat.label}
                      </button>
                    ))}
                    {categoryFilters.length > 0 && (
                      <button
                        onClick={() => setCategoryFilters([])}
                        className="px-2 py-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-white/40 text-xs">
                  {filteredDocs.length} of {documents.length} documents
                  {(statusFilter !== 'all' || categoryFilters.length > 0 || searchQuery) && ' (filtered)'}
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
                      onClick={() => openPdfView(index)}
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
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">o</kbd>
                  <span className="ml-2">to open PDF</span>
                </div>
              </div>
            </>
          )}
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
