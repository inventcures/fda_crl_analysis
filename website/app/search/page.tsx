'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/SearchBar'
import SearchResults from '@/components/SearchResults'
import { useSearch, CRLDocument } from '@/lib/useSearch'

export default function SearchPage() {
  const [documents, setDocuments] = useState<CRLDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load search data
  useEffect(() => {
    fetch('/data/search_crls.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load search data')
        return res.json()
      })
      .then(data => {
        setDocuments(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Initialize search
  const { query, setQuery, results, resultCount, isSearching } = useSearch(documents, {
    threshold: 0.3,
    includeMatches: true,
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
            CRL Database Search
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            Search <span className="text-text-secondary">Complete Response Letters</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Search across <span className="font-mono font-medium text-text-primary">{documents.length}</span> CRLs by drug name, sponsor, deficiencies, or full text.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            resultCount={resultCount}
            isSearching={isSearching}
          />
        </div>

        {/* Search Tips */}
        {!isSearching && (
          <div className="bg-accent-light border-l-4 border-accent p-6 rounded-sm mb-8">
            <h3 className="font-mono font-bold text-text-primary mb-3">SEARCH TIPS</h3>
            <ul className="space-y-2 text-sm text-text-primary font-mono">
              <li>• Search by drug name: "bevacizumab", "keytruda"</li>
              <li>• Search by sponsor: "genentech", "merck"</li>
              <li>• Search by deficiency type: "manufacturing", "efficacy", "safety"</li>
              <li>• Search by therapeutic area: "oncology", "cardiology"</li>
              <li>• Full-text search works for any content in the CRL</li>
              <li>• Fuzzy matching handles typos automatically</li>
            </ul>
          </div>
        )}

        {/* Results */}
        <SearchResults results={results} isSearching={isSearching} query={query} />
      </div>
    </div>
  )
}
