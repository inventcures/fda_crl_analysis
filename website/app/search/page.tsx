'use client'

import { useState, useEffect, useMemo } from 'react'
import SearchBar from '@/components/SearchBar'
import SearchResults from '@/components/SearchResults'
import { useHybridSearch } from '@/lib/useHybridSearch'

interface CRLDocument {
  file_hash: string
  drug_name?: string
  application_number?: string
  sponsor_name?: string
  therapeutic_area?: string
  approval_status?: string
  letter_date?: string
  deficiency_categories?: string[]
  [key: string]: any
}

export default function SearchPage() {
  const [documents, setDocuments] = useState<CRLDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate autocomplete suggestions from documents
  const suggestions = useMemo(() => {
    const suggestionSet = new Set<string>()

    documents.forEach((doc) => {
      // Add drug names
      if (doc.drug_name && doc.drug_name !== 'Unknown') {
        suggestionSet.add(doc.drug_name)
      }

      // Add sponsor names
      if (doc.sponsor_name && doc.sponsor_name !== 'Unknown') {
        suggestionSet.add(doc.sponsor_name)
      }

      // Add therapeutic areas
      if (doc.therapeutic_area && doc.therapeutic_area !== 'unknown') {
        // Capitalize first letter
        const area = doc.therapeutic_area.charAt(0).toUpperCase() + doc.therapeutic_area.slice(1)
        suggestionSet.add(area)
      }

      // Add deficiency categories (formatted nicely)
      if (doc.deficiency_categories) {
        doc.deficiency_categories.forEach((cat) => {
          // Convert snake_case to Title Case
          const formatted = cat
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          suggestionSet.add(formatted)
        })
      }

      // Add application numbers
      if (doc.application_number) {
        suggestionSet.add(doc.application_number)
      }
    })

    // Sort alphabetically
    return Array.from(suggestionSet).sort((a, b) => a.localeCompare(b))
  }, [documents])

  // Load search data
  useEffect(() => {
    fetch('/data/search_crls.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load search data')
        return res.json()
      })
      .then((data) => {
        setDocuments(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Initialize hybrid search
  const {
    query,
    setQuery,
    results,
    isSearching,
    searchMode,
    setSearchMode,
    isModelLoading,
    modelProgress,
    isSemanticReady,
    loadModel,
  } = useHybridSearch(documents, {
    initialMode: 'hybrid',
    autoLoadModel: false, // User triggers model load
  })

  if (loading) {
    return (
      <div className="bg-page min-h-screen py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center py-24">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
            <p className="mt-4 text-text-secondary font-mono">Loading CRL database...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-page min-h-screen py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="bg-red-50 border-l-4 border-error p-6 rounded-sm">
            <p className="text-error font-bold font-mono">Error loading search data</p>
            <p className="text-red-700 text-sm mt-1 font-mono">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Hybrid Search
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            Search <span className="text-text-secondary">Complete Response Letters</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Search across{' '}
            <span className="font-mono font-medium text-text-primary">{documents.length}</span> CRLs
            using hybrid BM25 + semantic search.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            resultCount={results.length}
            isSearching={isSearching}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
            isModelLoading={isModelLoading}
            modelProgress={modelProgress}
            isSemanticReady={isSemanticReady}
            onLoadModel={loadModel}
            suggestions={suggestions}
          />
        </div>

        {/* Search Tips */}
        {!isSearching && !query && (
          <div className="bg-accent-light border-l-4 border-accent p-6 rounded-sm mb-8">
            <h3 className="font-mono font-bold text-text-primary mb-3">SEARCH MODES</h3>
            <ul className="space-y-2 text-sm text-text-primary font-mono">
              <li>
                <strong>⚡ Hybrid</strong> — Combines keyword matching + semantic understanding
                (recommended)
              </li>
              <li>
                <strong>🔤 Keyword (BM25)</strong> — Exact term matching, great for drug names &
                numbers
              </li>
              <li>
                <strong>🧠 Semantic (AI)</strong> — Finds conceptually similar content (e.g.,
                "heart problems" → cardiac issues)
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-accent/20">
              <h4 className="font-mono font-bold text-text-primary mb-2">EXAMPLE SEARCHES</h4>
              <ul className="space-y-1 text-sm text-text-secondary font-mono">
                <li>• Drug names: "keytruda", "opdivo", "herceptin"</li>
                <li>• Semantic: "manufacturing quality issues", "patient safety concerns"</li>
                <li>• Deficiencies: "bioequivalence failure", "statistical methodology"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Results */}
        <SearchResults results={results} isSearching={isSearching} query={query} />
      </div>
    </div>
  )
}
