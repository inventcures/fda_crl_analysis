'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Info,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

// Types
interface NgramItem {
  text: string
  count: number
}

interface ComparativeNgram {
  text: string
  approved_count: number
  unapproved_count: number
  approved_normalized: number
  unapproved_normalized: number
  difference: number
  total: number
}

interface NgramData {
  bigrams: {
    approved: NgramItem[]
    unapproved: NgramItem[]
    comparative: ComparativeNgram[]
  }
  trigrams: {
    approved: NgramItem[]
    unapproved: NgramItem[]
    comparative: ComparativeNgram[]
  }
  stats: {
    approved_documents: number
    unapproved_documents: number
  }
}

type NgramType = 'bigrams' | 'trigrams'
type ViewMode = 'approved' | 'unapproved' | 'comparative'
type SortMode = 'count' | 'alphabetical' | 'difference'

const COLORS = {
  approved: '#059669',
  unapproved: '#64748b',
  positive: '#059669',
  negative: '#94a3b8',
  grid: '#e2e8f0',
  text: '#64748b',
}

// Type toggle
function TypeToggle({
  type,
  onChange
}: {
  type: NgramType
  onChange: (type: NgramType) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange('bigrams')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          type === 'bigrams'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Bigrams (2-word)
      </button>
      <button
        onClick={() => onChange('trigrams')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          type === 'trigrams'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Trigrams (3-word)
      </button>
    </div>
  )
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
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'approved'
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Approved
      </button>
      <button
        onClick={() => onChange('unapproved')}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'unapproved'
            ? 'bg-slate-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Unapproved
      </button>
      <button
        onClick={() => onChange('comparative')}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
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

// Sort controls
function SortControls({
  mode,
  onChange,
  viewMode
}: {
  mode: SortMode
  onChange: (mode: SortMode) => void
  viewMode: ViewMode
}) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-gray-400" />
      <span className="text-xs text-gray-500">Sort:</span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange('count')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
            mode === 'count'
              ? 'bg-slate-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {viewMode === 'comparative' ? 'Total' : 'Frequency'}
        </button>
        {viewMode === 'comparative' && (
          <button
            onClick={() => onChange('difference')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'difference'
                ? 'bg-slate-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Difference
          </button>
        )}
        <button
          onClick={() => onChange('alphabetical')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
            mode === 'alphabetical'
              ? 'bg-slate-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          A-Z
        </button>
      </div>
    </div>
  )
}

// Custom tooltip for single view
function SingleViewTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white shadow-xl rounded-lg p-3 border border-gray-200"
    >
      <p className="font-semibold text-sm text-slate-800 mb-2">"{data?.text}"</p>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
        <span className="text-sm">Count:</span>
        <span className="font-mono font-semibold">{data?.count}</span>
      </div>
    </motion.div>
  )
}

// Custom tooltip for comparative view
function ComparativeTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white shadow-xl rounded-lg p-4 border border-gray-200 min-w-[200px]"
    >
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-2 mb-2">
        "{data?.text}"
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            Approved
          </span>
          <span className="font-mono font-semibold">{data?.approved_count}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            Unapproved
          </span>
          <span className="font-mono font-semibold">{data?.unapproved_count}</span>
        </div>
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-gray-500">Difference</span>
          <span className={`font-mono font-semibold ${
            data?.difference > 0 ? 'text-emerald-600' : 'text-slate-600'
          }`}>
            {data?.difference > 0 ? '+' : ''}{(data?.difference * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Ngram detail panel (shown on click)
function NgramDetailPanel({
  ngram,
  data,
  onClose
}: {
  ngram: string
  data: NgramData
  onClose: () => void
}) {
  // Find this ngram in both bigrams and trigrams
  const bigramComp = data.bigrams.comparative.find(n => n.text === ngram)
  const trigramComp = data.trigrams.comparative.find(n => n.text === ngram)
  const ngramInfo = bigramComp || trigramComp

  if (!ngramInfo) return null

  const approvedPct = ngramInfo.total > 0
    ? ((ngramInfo.approved_count / ngramInfo.total) * 100).toFixed(1)
    : '0'
  const unapprovedPct = ngramInfo.total > 0
    ? ((ngramInfo.unapproved_count / ngramInfo.total) * 100).toFixed(1)
    : '0'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-lg text-gray-900">"{ngramInfo.text}"</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-xs text-emerald-600 uppercase font-semibold">Approved</div>
          <div className="text-xl font-bold text-emerald-700">{ngramInfo.approved_count}</div>
          <div className="text-xs text-emerald-600">{approvedPct}%</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 uppercase font-semibold">Unapproved</div>
          <div className="text-xl font-bold text-gray-700">{ngramInfo.unapproved_count}</div>
          <div className="text-xs text-gray-600">{unapprovedPct}%</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 uppercase font-semibold">Total</div>
          <div className="text-xl font-bold text-blue-700">{ngramInfo.total}</div>
          <div className="text-xs text-blue-600">occurrences</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center flex flex-col justify-center">
          {ngramInfo.difference > 0.01 ? (
            <>
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto" />
              <div className="text-xs text-emerald-600 mt-1">More in Approved</div>
            </>
          ) : ngramInfo.difference < -0.01 ? (
            <>
              <TrendingDown className="w-5 h-5 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-600 mt-1">More in Unapproved</div>
            </>
          ) : (
            <>
              <Minus className="w-5 h-5 text-gray-400 mx-auto" />
              <div className="text-xs text-gray-500 mt-1">Similar</div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Main component
export default function InteractiveNgramChart() {
  const [data, setData] = useState<NgramData | null>(null)
  const [loading, setLoading] = useState(true)
  const [ngramType, setNgramType] = useState<NgramType>('bigrams')
  const [viewMode, setViewMode] = useState<ViewMode>('comparative')
  const [sortMode, setSortMode] = useState<SortMode>('count')
  const [selectedNgram, setSelectedNgram] = useState<string | null>(null)
  const [limit, setLimit] = useState(15)

  // Load data
  useEffect(() => {
    fetch('/data/ngram_data.json')
      .then(res => res.json())
      .then((data: NgramData) => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load n-gram data:', err)
        setLoading(false)
      })
  }, [])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return []

    const source = data[ngramType]

    if (viewMode === 'approved' || viewMode === 'unapproved') {
      let items = [...source[viewMode]]

      // Sort
      if (sortMode === 'count') {
        items.sort((a, b) => b.count - a.count)
      } else if (sortMode === 'alphabetical') {
        items.sort((a, b) => a.text.localeCompare(b.text))
      }

      return items.slice(0, limit)
    } else {
      // Comparative view
      let items = [...source.comparative]

      if (sortMode === 'count') {
        items.sort((a, b) => b.total - a.total)
      } else if (sortMode === 'difference') {
        items.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
      } else if (sortMode === 'alphabetical') {
        items.sort((a, b) => a.text.localeCompare(b.text))
      }

      return items.slice(0, limit)
    }
  }, [data, ngramType, viewMode, sortMode, limit])

  const handleBarClick = useCallback((data: any) => {
    if (data?.text) {
      setSelectedNgram(data.text === selectedNgram ? null : data.text)
    }
  }, [selectedNgram])

  if (loading) {
    return <ChartSkeleton type="bar" height={400} />
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500">Failed to load n-gram data</p>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <TypeToggle type={ngramType} onChange={setNgramType} />
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <SortControls mode={sortMode} onChange={setSortMode} viewMode={viewMode} />

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Show:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
                <option value={25}>Top 25</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <div className="text-gray-500">N-gram Type</div>
            <div className="font-bold text-gray-900 capitalize">{ngramType}</div>
          </div>
          <div>
            <div className="text-emerald-600">Approved Docs</div>
            <div className="font-bold text-emerald-700">{data.stats.approved_documents}</div>
          </div>
          <div>
            <div className="text-gray-500">Unapproved Docs</div>
            <div className="font-bold text-gray-700">{data.stats.unapproved_documents}</div>
          </div>
          <div>
            <div className="text-blue-600">Showing</div>
            <div className="font-bold text-blue-700">{chartData.length} phrases</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {viewMode === 'approved' && `Top ${ngramType === 'bigrams' ? 'Bigrams' : 'Trigrams'} in Approved CRLs`}
            {viewMode === 'unapproved' && `Top ${ngramType === 'bigrams' ? 'Bigrams' : 'Trigrams'} in Unapproved CRLs`}
            {viewMode === 'comparative' && `${ngramType === 'bigrams' ? 'Bigram' : 'Trigram'} Comparison by Outcome`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {viewMode === 'comparative'
              ? 'Bars show occurrence counts. Click a bar to see detailed breakdown.'
              : 'Click any bar to see how this phrase compares across outcomes.'
            }
          </p>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${ngramType}-${viewMode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 32 + 60)}>
                {viewMode === 'comparative' ? (
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 140, bottom: 5 }}
                    onClick={(e) => e?.activePayload?.[0] && handleBarClick(e.activePayload[0].payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal stroke={COLORS.grid} />
                    <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 11 }} />
                    <YAxis
                      dataKey="text"
                      type="category"
                      width={130}
                      tick={{ fill: '#334155', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ComparativeTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend />
                    <Bar
                      dataKey="approved_count"
                      name="Approved"
                      stackId="a"
                      fill={COLORS.approved}
                      radius={[0, 0, 0, 0]}
                      cursor="pointer"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell
                          key={`approved-${index}`}
                          fill={COLORS.approved}
                          opacity={selectedNgram && selectedNgram !== entry.text ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="unapproved_count"
                      name="Unapproved"
                      stackId="a"
                      fill={COLORS.unapproved}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell
                          key={`unapproved-${index}`}
                          fill={COLORS.unapproved}
                          opacity={selectedNgram && selectedNgram !== entry.text ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 140, bottom: 5 }}
                    onClick={(e) => e?.activePayload?.[0] && handleBarClick(e.activePayload[0].payload)}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal stroke={COLORS.grid} />
                    <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 11 }} />
                    <YAxis
                      dataKey="text"
                      type="category"
                      width={130}
                      tick={{ fill: '#334155', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<SingleViewTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar
                      dataKey="count"
                      name="Count"
                      fill={viewMode === 'approved' ? COLORS.approved : COLORS.unapproved}
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      cursor="pointer"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={viewMode === 'approved' ? COLORS.approved : COLORS.unapproved}
                          opacity={selectedNgram && selectedNgram !== entry.text ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>

          {/* Selected n-gram detail panel */}
          <AnimatePresence>
            {selectedNgram && (
              <NgramDetailPanel
                ngram={selectedNgram}
                data={data}
                onClose={() => setSelectedNgram(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-2 text-sm text-blue-800">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>About N-grams:</strong> Bigrams are 2-word phrases, trigrams are 3-word phrases.
            In comparative mode, stacked bars show how phrase frequency differs between approved and
            unapproved CRLs. Normalized counts account for different document counts in each group.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
