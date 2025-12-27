'use client'

import { Search, X, Zap, Type, Brain, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, KeyboardEvent } from 'react'
import { SearchMode } from '@/lib/hybridSearch'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: number
  isSearching?: boolean
  // Hybrid search props
  searchMode?: SearchMode
  onSearchModeChange?: (mode: SearchMode) => void
  isModelLoading?: boolean
  modelProgress?: number
  isSemanticReady?: boolean
  onLoadModel?: () => void
  // Autocomplete props
  suggestions?: string[]
}

const SEARCH_MODES: Array<{
  mode: SearchMode
  icon: typeof Zap
  label: string
  shortLabel: string
  description: string
}> = [
  {
    mode: 'hybrid',
    icon: Zap,
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    description: 'Best of keyword + semantic',
  },
  {
    mode: 'keyword',
    icon: Type,
    label: 'Keyword',
    shortLabel: 'BM25',
    description: 'Exact term matching',
  },
  {
    mode: 'semantic',
    icon: Brain,
    label: 'Semantic',
    shortLabel: 'AI',
    description: 'Conceptual similarity',
  },
]

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search CRLs by drug name, sponsor, deficiencies...',
  resultCount,
  isSearching,
  searchMode = 'hybrid',
  onSearchModeChange,
  isModelLoading = false,
  modelProgress = 0,
  isSemanticReady = false,
  onLoadModel,
  suggestions = [],
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const currentModeConfig = SEARCH_MODES.find((m) => m.mode === searchMode) || SEARCH_MODES[0]

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!value.trim() || value.length < 2) return []

    const query = value.toLowerCase()
    const matches = suggestions
      .filter((s) => s.toLowerCase().includes(query) && s.toLowerCase() !== query)
      .slice(0, 8) // Limit to 8 suggestions

    // Sort by relevance: starts with query first, then contains query
    return matches.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(query)
      const bStarts = b.toLowerCase().startsWith(query)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.length - b.length // Shorter matches first
    })
  }, [value, suggestions])

  // Get the top suggestion for inline completion
  const inlineSuggestion = useMemo(() => {
    if (!value.trim() || value.length < 2) return null
    const query = value.toLowerCase()
    const match = suggestions.find(
      (s) => s.toLowerCase().startsWith(query) && s.toLowerCase() !== query
    )
    return match || null
  }, [value, suggestions])

  // Show/hide suggestions based on input and focus
  useEffect(() => {
    setShowSuggestions(isFocused && filteredSuggestions.length > 0)
    setSelectedIndex(-1)
  }, [isFocused, filteredSuggestions.length])

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && inlineSuggestion) {
      e.preventDefault()
      onChange(inlineSuggestion)
      setShowSuggestions(false)
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      onChange(filteredSuggestions[selectedIndex])
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Select a suggestion
  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full space-y-3">
      {/* Search Input */}
      <div
        className={`relative flex items-center border-2 rounded-lg transition-all ${
          isFocused
            ? 'border-accent shadow-sm ring-1 ring-accent/20'
            : 'border-border-light hover:border-border-dark'
        }`}
      >
        <Search
          className={`absolute left-4 transition-colors ${
            isFocused ? 'text-accent' : 'text-text-secondary'
          }`}
          size={20}
        />

        {/* Input with inline ghost suggestion */}
        <div className="relative w-full">
          {/* Ghost text for Tab completion */}
          {inlineSuggestion && isFocused && (
            <div className="absolute inset-0 pl-12 pr-12 py-4 text-lg pointer-events-none">
              <span className="invisible">{value}</span>
              <span className="text-text-secondary/40">
                {inlineSuggestion.slice(value.length)}
              </span>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 text-lg rounded-lg focus:outline-none text-text-primary placeholder:text-text-secondary/50 font-light bg-transparent relative z-10"
          />
        </div>

        {/* Tab hint */}
        {inlineSuggestion && isFocused && (
          <div className="absolute right-12 flex items-center gap-1 text-xs text-text-secondary/60">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">
              Tab
            </kbd>
          </div>
        )}

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
          >
            <X size={20} />
          </button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectSuggestion(suggestion)
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-mono transition-colors flex items-center gap-2 ${
                  index === selectedIndex
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-primary hover:bg-gray-50'
                }`}
              >
                <Search size={14} className="text-text-secondary/50 flex-shrink-0" />
                <span>
                  {highlightMatch(suggestion, value)}
                </span>
              </button>
            ))}
            <div className="px-4 py-2 text-xs text-text-secondary/60 bg-gray-50 border-t border-border-light flex items-center gap-2">
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px] ml-2">Tab</kbd>
              <span>complete</span>
              <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[10px] ml-2">Enter</kbd>
              <span>select</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Toggle & Status */}
      {onSearchModeChange && (
        <div className="flex items-center justify-between">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {SEARCH_MODES.map((modeConfig) => {
              const Icon = modeConfig.icon
              const isActive = searchMode === modeConfig.mode
              const isDisabled =
                modeConfig.mode === 'semantic' && !isSemanticReady && !isModelLoading
              const needsModel =
                (modeConfig.mode === 'semantic' || modeConfig.mode === 'hybrid') &&
                !isSemanticReady

              return (
                <button
                  key={modeConfig.mode}
                  onClick={() => {
                    if (needsModel && onLoadModel) {
                      onLoadModel()
                    }
                    onSearchModeChange(modeConfig.mode)
                  }}
                  disabled={isModelLoading && modeConfig.mode === 'semantic'}
                  title={modeConfig.description}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${
                      isActive
                        ? 'bg-white text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
                    }
                    ${isDisabled ? 'opacity-50' : ''}
                  `}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{modeConfig.shortLabel}</span>
                </button>
              )
            })}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {isModelLoading && (
              <div className="flex items-center gap-1.5 text-accent">
                <Loader2 size={12} className="animate-spin" />
                <span>Loading AI ({Math.round(modelProgress)}%)</span>
              </div>
            )}

            {!isModelLoading && isSemanticReady && searchMode !== 'keyword' && (
              <div className="flex items-center gap-1 text-emerald-600">
                <Brain size={12} />
                <span>AI Ready</span>
              </div>
            )}

            {!isModelLoading && !isSemanticReady && searchMode !== 'keyword' && onLoadModel && (
              <button
                onClick={onLoadModel}
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <Brain size={12} />
                <span>Enable AI Search</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      {(isSearching || resultCount !== undefined) && value && (
        <div className="flex items-center gap-2 text-sm text-text-secondary font-mono">
          {isSearching ? (
            <div className="flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            resultCount !== undefined && (
              <>
                Found <strong className="text-text-primary">{resultCount}</strong> result
                {resultCount !== 1 ? 's' : ''}
                <span className="text-text-secondary/60">
                  ({currentModeConfig.label.toLowerCase()} search)
                </span>
              </>
            )
          )}
        </div>
      )}
    </div>
  )
}

// Helper to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-accent/20 text-accent font-medium">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  )
}
