'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Search,
  X,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

// Dynamically import ReactWordcloud to avoid SSR issues
const ReactWordcloud = dynamic(() => import('react-wordcloud'), {
  ssr: false,
  loading: () => <ChartSkeleton type="wordcloud" height={350} />
})

// Types
interface WordData {
  text: string
  value: number
}

interface ComparativeWord {
  text: string
  approved_count: number
  unapproved_count: number
  difference: number
  total: number
}

interface WordCloudData {
  approved: WordData[]
  unapproved: WordData[]
  comparative: ComparativeWord[]
  stats: {
    approved_total_words: number
    unapproved_total_words: number
    approved_unique_words: number
    unapproved_unique_words: number
  }
}

type ViewMode = 'approved' | 'unapproved' | 'comparative'

// Colors
const COLORS = {
  approved: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
  unapproved: ['#475569', '#64748b', '#94a3b8', '#cbd5e1'],
  positive: '#059669',
  negative: '#64748b',
  neutral: '#94a3b8',
}

// View mode toggle
function ViewModeToggle({
  mode,
  onChange
}: {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange('approved')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'approved'
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Approved
      </button>
      <button
        onClick={() => onChange('unapproved')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'unapproved'
            ? 'bg-slate-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Unapproved
      </button>
      <button
        onClick={() => onChange('comparative')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'comparative'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Compare
      </button>
    </div>
  )
}

// Word detail tooltip/panel
function WordDetailPanel({
  word,
  data,
  onClose
}: {
  word: string
  data: WordCloudData
  onClose: () => void
}) {
  const wordInfo = useMemo(() => {
    const comparative = data.comparative.find(w => w.text === word)
    if (comparative) return comparative

    const approvedWord = data.approved.find(w => w.text === word)
    const unapprovedWord = data.unapproved.find(w => w.text === word)

    return {
      text: word,
      approved_count: approvedWord?.value || 0,
      unapproved_count: unapprovedWord?.value || 0,
      difference: 0,
      total: (approvedWord?.value || 0) + (unapprovedWord?.value || 0)
    }
  }, [word, data])

  const approvedPct = wordInfo.total > 0
    ? ((wordInfo.approved_count / wordInfo.total) * 100).toFixed(1)
    : '0'
  const unapprovedPct = wordInfo.total > 0
    ? ((wordInfo.unapproved_count / wordInfo.total) * 100).toFixed(1)
    : '0'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-lg text-gray-900">"{wordInfo.text}"</h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-xs text-emerald-600 uppercase font-semibold">Approved</div>
          <div className="text-xl font-bold text-emerald-700">{wordInfo.approved_count}</div>
          <div className="text-xs text-emerald-600">{approvedPct}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 uppercase font-semibold">Unapproved</div>
          <div className="text-xl font-bold text-gray-700">{wordInfo.unapproved_count}</div>
          <div className="text-xs text-gray-600">{unapprovedPct}%</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 uppercase font-semibold">Total</div>
          <div className="text-xl font-bold text-blue-700">{wordInfo.total}</div>
          <div className="text-xs text-blue-600">occurrences</div>
        </div>
      </div>

      {wordInfo.difference !== 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm">
          {wordInfo.difference > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">More common in approved CRLs</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">More common in unapproved CRLs</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Min frequency slider
function FrequencySlider({
  value,
  max,
  onChange
}: {
  value: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Filter className="w-4 h-4 text-gray-400" />
      <span className="text-xs text-gray-500 whitespace-nowrap">Min freq:</span>
      <input
        type="range"
        min={1}
        max={Math.min(max, 100)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <span className="text-xs font-mono text-gray-600 w-8">{value}</span>
    </div>
  )
}

// Main component
export default function InteractiveWordCloud() {
  const [data, setData] = useState<WordCloudData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('comparative')
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [minFrequency, setMinFrequency] = useState(5)
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    fetch('/data/wordcloud_data.json')
      .then(res => res.json())
      .then((data: WordCloudData) => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load word cloud data:', err)
        setLoading(false)
      })
  }, [])

  // Filter words based on mode and frequency
  const words = useMemo(() => {
    if (!data) return []

    let wordList: WordData[] = []

    if (viewMode === 'approved') {
      wordList = data.approved
    } else if (viewMode === 'unapproved') {
      wordList = data.unapproved
    } else {
      // Comparative view - use difference as value, with color indicating direction
      wordList = data.comparative.map(w => ({
        text: w.text,
        value: Math.abs(w.difference) + 10, // Offset to ensure visibility
      }))
    }

    // Filter by minimum frequency
    return wordList.filter(w => w.value >= minFrequency)
  }, [data, viewMode, minFrequency])

  // Get max frequency for slider
  const maxFrequency = useMemo(() => {
    if (!data) return 100
    const allValues = [...data.approved, ...data.unapproved].map(w => w.value)
    return Math.max(...allValues, 100)
  }, [data])

  // Word cloud options
  const options = useMemo(() => ({
    colors: viewMode === 'approved'
      ? COLORS.approved
      : viewMode === 'unapproved'
        ? COLORS.unapproved
        : ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizes: [14, 60] as [number, number],
    fontStyle: 'normal',
    fontWeight: 'bold',
    padding: 2,
    rotations: 2,
    rotationAngles: [0, 0] as [number, number], // Keep text horizontal
    scale: 'sqrt' as const,
    spiral: 'rectangular' as const,
    transitionDuration: 500,
  }), [viewMode])

  // Callbacks for word interactions
  const callbacks = useMemo(() => ({
    onWordClick: (word: WordData) => {
      setSelectedWord(word.text)
    },
    getWordTooltip: (word: WordData) => {
      if (viewMode === 'comparative' && data) {
        const comp = data.comparative.find(w => w.text === word.text)
        if (comp) {
          const direction = comp.difference > 0 ? 'approved' : 'unapproved'
          return `${word.text}: More common in ${direction} CRLs`
        }
      }
      return `${word.text}: ${word.value} occurrences`
    },
  }), [viewMode, data])

  // Handle search
  const highlightedWords = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const query = searchQuery.toLowerCase()
    return new Set(words.filter(w => w.text.includes(query)).map(w => w.text))
  }, [words, searchQuery])

  if (loading) {
    return (
      <div className="space-y-4">
        <ChartSkeleton type="stat" height={60} />
        <ChartSkeleton type="wordcloud" height={350} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500">Failed to load word cloud data</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />

          <div className="flex flex-wrap items-center gap-4">
            <FrequencySlider
              value={minFrequency}
              max={maxFrequency}
              onChange={setMinFrequency}
            />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <div className="text-gray-500">Showing</div>
            <div className="font-bold text-gray-900">{words.length} words</div>
          </div>
          <div>
            <div className="text-emerald-600">Approved Total</div>
            <div className="font-bold text-emerald-700">{data.stats.approved_total_words.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500">Unapproved Total</div>
            <div className="font-bold text-gray-700">{data.stats.unapproved_total_words.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-blue-600">View Mode</div>
            <div className="font-bold text-blue-700 capitalize">{viewMode}</div>
          </div>
        </div>
      </div>

      {/* Word Cloud */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            {viewMode === 'approved' && 'Top Words in Approved CRLs'}
            {viewMode === 'unapproved' && 'Top Words in Unapproved CRLs'}
            {viewMode === 'comparative' && 'Distinctive Words by Outcome'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {viewMode === 'comparative'
              ? 'Words sized by how much more frequently they appear in one outcome vs the other'
              : 'Words sized by frequency. Click a word to see detailed breakdown.'
            }
          </p>
        </div>

        <div className="h-[400px] p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {words.length > 0 ? (
                <ReactWordcloud
                  words={words}
                  options={options}
                  callbacks={callbacks}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No words match the current filter
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Selected word detail panel */}
        <AnimatePresence>
          {selectedWord && (
            <WordDetailPanel
              word={selectedWord}
              data={data}
              onClose={() => setSelectedWord(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Legend/Help */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-2 text-sm text-blue-800">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>How to read:</strong> In comparative mode, larger words indicate stronger
            association with one outcome. Click any word to see exact counts for approved
            vs unapproved CRLs. Use the frequency slider to filter out rare terms.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
