import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'

export interface SearchResult {
  item: CRLDocument
  score?: number
  matches?: any[]
}

export interface CRLDocument {
  file_hash: string
  original_filename: string
  application_number: string
  drug_name: string
  sponsor_name: string
  approval_status: 'approved' | 'unapproved'
  therapeutic_area: string
  letter_date: string
  application_type: string
  raw_text: string
  deficiency_categories: string[]
  deficiencies_text: string
  has_safety_concerns: boolean
  has_efficacy_concerns: boolean
  has_cmc_issues: boolean
  requests_new_trial: boolean
  snippet: string
  page_count: number
}

export interface SearchOptions {
  threshold?: number  // 0.0 = perfect match, 1.0 = match anything (default: 0.3)
  limit?: number      // Max results to return
  includeMatches?: boolean  // Include match positions for highlighting
}

export function useSearch(documents: CRLDocument[], options: SearchOptions = {}) {
  const [query, setQuery] = useState('')

  // Configure Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(documents, {
      keys: [
        { name: 'drug_name', weight: 2 },           // Highest priority
        { name: 'application_number', weight: 2 },
        { name: 'sponsor_name', weight: 1.5 },
        { name: 'raw_text', weight: 1 },           // Full text
        { name: 'deficiencies_text', weight: 1.5 },
        { name: 'therapeutic_area', weight: 1 },
        { name: 'deficiency_categories', weight: 1 },
      ],
      threshold: options.threshold ?? 0.3,
      includeScore: true,
      includeMatches: options.includeMatches ?? true,
      ignoreLocation: true,  // Search entire text, not just beginning
      minMatchCharLength: 2,
    })
  }, [documents, options.threshold, options.includeMatches])

  // Perform search
  const results = useMemo(() => {
    if (!query.trim()) {
      return documents.map(item => ({ item, score: 0 }))
    }

    const fuseResults = fuse.search(query)

    if (options.limit) {
      return fuseResults.slice(0, options.limit)
    }

    return fuseResults
  }, [query, fuse, documents, options.limit])

  return {
    query,
    setQuery,
    results,
    resultCount: results.length,
    isSearching: query.trim().length > 0,
  }
}
