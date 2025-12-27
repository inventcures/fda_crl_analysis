'use client'

import { Search, X, Zap, Type, Brain, Loader2 } from 'lucide-react'
import { useState } from 'react'
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
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  const currentModeConfig = SEARCH_MODES.find((m) => m.mode === searchMode) || SEARCH_MODES[0]

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

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 text-lg rounded-lg focus:outline-none text-text-primary placeholder:text-text-secondary/50 font-light"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
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
