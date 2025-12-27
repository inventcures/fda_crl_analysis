'use client'

import React, { useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FileText, Eye, Search, X } from 'lucide-react'
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

// Individual stacking card component
function StackingCard({
  doc,
  index,
  totalCards,
  isSelected,
  onSelect,
  onDoubleClick,
  containerRef,
}: {
  doc: Document
  index: number
  totalCards: number
  isSelected: boolean
  onSelect: () => void
  onDoubleClick: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: containerRef,
    offset: ['start end', 'start start'],
  })

  // Scale down progressively as you scroll past
  const targetScale = 1 - (totalCards - index) * 0.02
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale])

  return (
    <div
      ref={cardRef}
      className="sticky top-4 h-[180px] flex items-center justify-center"
      style={{ zIndex: index }}
    >
      <motion.div
        style={{ scale }}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        className={`
          w-full max-w-md h-[160px] rounded-2xl shadow-2xl cursor-pointer
          flex flex-col items-center justify-center p-6
          transition-all duration-200
          ${isSelected
            ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-slate-900'
            : 'hover:ring-2 hover:ring-white/30'}
          ${doc.approval_status === 'approved'
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
            : 'bg-gradient-to-br from-rose-500 to-rose-700'}
        `}
      >
        {/* CRL Number - Centered & Prominent */}
        <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          {doc.application_number || 'N/A'}
        </div>

        {/* Drug Name in Parentheses */}
        <div className="text-lg text-white/80 text-center">
          ({doc.enriched?.openfda_brand_name || doc.drug_name || 'Unknown Drug'})
        </div>

        {/* Status badge */}
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
          doc.approval_status === 'approved'
            ? 'bg-white/20 text-white'
            : 'bg-white/20 text-white'
        }`}>
          {doc.approval_status === 'approved' ? '✓ Rescued' : '✗ Not Rescued'}
        </div>
      </motion.div>
    </div>
  )
}

export default function DocumentViewerLayout({ documents }: DocumentViewerLayoutProps) {
  const router = useRouter()
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleViewDocument = useCallback(
    (doc: Document) => {
      router.push(`/document-view/${doc.file_hash}`)
    },
    [router]
  )

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Two-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Stacked Cards */}
        <div className="w-1/2 flex flex-col bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CRLs by drug name, number, deficiencies..."
                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl
                  text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {filteredDocs.length} of {documents.length} documents
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          </div>

          {/* Scrollable Card Stack */}
          <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4 pb-[50vh]">
              {filteredDocs.map((doc, index) => (
                <StackingCard
                  key={doc.file_hash}
                  doc={doc}
                  index={index}
                  totalCards={filteredDocs.length}
                  isSelected={selectedDoc?.file_hash === doc.file_hash}
                  onSelect={() => setSelectedDoc(doc)}
                  onDoubleClick={() => handleViewDocument(doc)}
                  containerRef={containerRef}
                />
              ))}

              {filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Search size={48} strokeWidth={1} className="mb-4 opacity-50" />
                  <p className="text-lg">No documents found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-sm">
              Scroll to browse • Click to select • Double-click to view
            </p>
          </div>
        </div>

        {/* Vertical Divider Line */}
        <div className="w-[3px] bg-slate-600 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-80" />
        </div>

        {/* Right Pane - Document Preview */}
        <div className="w-1/2 overflow-y-auto bg-slate-50">
          {selectedDoc ? (
            <div className="h-full flex flex-col">
              {/* Preview Header */}
              <div className="p-6 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                      {selectedDoc.application_number}
                    </h2>
                    <p className="text-lg text-slate-500 mt-1">
                      {selectedDoc.enriched?.openfda_brand_name ||
                        selectedDoc.drug_name ||
                        'Unknown Drug'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDocument(selectedDoc)}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Eye size={20} />
                    View Document
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Status */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Approval Status
                    </h3>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        selectedDoc.approval_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {selectedDoc.approval_status === 'approved' ? '✓ Approved' : '✗ Unapproved'}
                    </span>
                  </div>

                  {/* Letter Date */}
                  {selectedDoc.letter_date && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Letter Date
                      </h3>
                      <p className="text-lg text-slate-700">{selectedDoc.letter_date}</p>
                    </div>
                  )}

                  {/* Deficiency Categories */}
                  {selectedDoc.deficiency_categories.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Deficiency Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoc.deficiency_categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg capitalize font-medium"
                          >
                            {cat.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Prompt */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <strong>Tip:</strong> Double-click a card or click "View Document" to open the
                      interactive viewer with highlighted deficiencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-6">
                <FileText size={40} strokeWidth={1.5} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-600 mb-2">Select a Document</h3>
              <p className="text-center max-w-sm text-slate-500">
                Scroll through the stack and click on any CRL card to preview its details, or
                double-click to open the full interactive document viewer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
