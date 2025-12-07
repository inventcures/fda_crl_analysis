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
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center py-24">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-fda-blue border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading CRL database...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
          <p className="text-red-800 font-semibold">Error loading search data</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Search FDA Complete Response Letters
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Search across {documents.length} CRLs by drug name, sponsor, deficiencies, or full text.
        </p>
      </div>

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
        <div className="bg-blue-50 border-l-4 border-fda-blue p-6 rounded-lg mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Search Tips</h3>
          <ul className="space-y-1 text-sm text-gray-700">
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
  )
}
