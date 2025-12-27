/**
 * React Hook for Hybrid Search
 *
 * Provides BM25 + Vector search with mode switching and loading states.
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { hybridSearch, HybridSearchResult, SearchMode } from './hybridSearch'
import { embeddingService, EmbeddingStatus } from './embeddingService'

interface CRLDocument {
  file_hash: string
  drug_name?: string
  application_number?: string
  sponsor_name?: string
  therapeutic_area?: string
  approval_status?: string
  letter_date?: string
  deficiency_categories?: string[]
  deficiencies_text?: string
  raw_text?: string
  [key: string]: any
}

interface UseHybridSearchOptions {
  initialMode?: SearchMode
  autoLoadModel?: boolean
  debounceMs?: number
  initialQuery?: string
}

interface UseHybridSearchReturn {
  // Search
  query: string
  setQuery: (query: string) => void
  results: CRLDocument[]
  searchResults: HybridSearchResult[]
  isSearching: boolean

  // Mode
  searchMode: SearchMode
  setSearchMode: (mode: SearchMode) => void

  // Loading states
  isIndexed: boolean
  modelStatus: EmbeddingStatus
  modelProgress: number
  isModelLoading: boolean
  isSemanticReady: boolean

  // Actions
  loadModel: () => Promise<void>
}

const DEFAULT_OPTIONS: UseHybridSearchOptions = {
  initialMode: 'hybrid',
  autoLoadModel: false,
  debounceMs: 200,
  initialQuery: '',
}

export function useHybridSearch(
  documents: CRLDocument[],
  options: UseHybridSearchOptions = {}
): UseHybridSearchReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // State
  const [query, setQuery] = useState(opts.initialQuery || '')
  const [searchResults, setSearchResults] = useState<HybridSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isIndexed, setIsIndexed] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>(opts.initialMode!)
  const [modelStatus, setModelStatus] = useState<EmbeddingStatus>('idle')
  const [modelProgress, setModelProgress] = useState(0)

  // Refs for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastQueryRef = useRef('')

  // Index documents when they change
  useEffect(() => {
    if (documents.length > 0) {
      hybridSearch.index(documents).then(() => {
        setIsIndexed(true)
      })
    }
  }, [documents])

  // Subscribe to model status changes
  useEffect(() => {
    const unsubscribe = embeddingService.subscribe(() => {
      setModelStatus(embeddingService.status)
      setModelProgress(embeddingService.progress)
    })

    // Set initial status
    setModelStatus(embeddingService.status)
    setModelProgress(embeddingService.progress)

    return unsubscribe
  }, [])

  // Auto-load model if enabled
  useEffect(() => {
    if (opts.autoLoadModel && modelStatus === 'idle') {
      embeddingService.init().catch(console.error)
    }
  }, [opts.autoLoadModel, modelStatus])

  // Load model manually
  const loadModel = useCallback(async () => {
    if (modelStatus === 'idle' || modelStatus === 'error') {
      await embeddingService.init()
    }
  }, [modelStatus])

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!isIndexed || !searchQuery.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      try {
        const results = await hybridSearch.search(searchQuery, { mode: searchMode })
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [isIndexed, searchMode]
  )

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, opts.debounceMs)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, performSearch, opts.debounceMs])

  // Re-search when mode changes (if there's a query)
  useEffect(() => {
    if (query.trim() && isIndexed) {
      performSearch(query)
    }
  }, [searchMode])

  // Get full documents from results
  const results = useMemo(() => {
    return hybridSearch.getDocuments(searchResults)
  }, [searchResults])

  // Derived states
  const isModelLoading = modelStatus === 'loading'
  const isSemanticReady = modelStatus === 'ready' && hybridSearch.isSemanticReady()

  return {
    query,
    setQuery,
    results,
    searchResults,
    isSearching,
    searchMode,
    setSearchMode,
    isIndexed,
    modelStatus,
    modelProgress,
    isModelLoading,
    isSemanticReady,
    loadModel,
  }
}
