'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts'
import {
  Calendar,
  TrendingUp,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'
import { useDashboard } from '@/contexts/DashboardContext'

// Types
interface CRLDocument {
  file_hash: string
  drug_name: string
  application_number: string
  application_type: string
  approval_status: 'approved' | 'unapproved'
  deficiency_categories: string[]
  therapeutic_area: string
  letter_date: string
  page_count: number
}

interface MonthlyData {
  month: string
  monthLabel: string
  year: number
  total: number
  approved: number
  unapproved: number
  cumulative: number
  documents: CRLDocument[]
}

interface YearlyData {
  year: number
  total: number
  approved: number
  unapproved: number
  rescueRate: number
}

type ViewMode = 'monthly' | 'yearly' | 'cumulative'
type FilterMode = 'all' | 'approved' | 'unapproved'

// Color constants
const COLORS = {
  approved: '#059669',
  unapproved: '#64748b',
  total: '#3b82f6',
  grid: '#e2e8f0',
  cumulative: '#8b5cf6',
  areaApproved: 'rgba(5, 150, 105, 0.3)',
  areaUnapproved: 'rgba(100, 116, 139, 0.3)',
}

// Parse date string like "October 15, 2020"
function parseLetterDate(dateStr: string): Date | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

// Format month for display
function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// View mode toggle
function ViewModeToggle({
  mode,
  onChange
}: {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  const options: { value: ViewMode; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'cumulative', label: 'Cumulative' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === opt.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Filter toggle
function FilterToggle({
  filter,
  onChange
}: {
  filter: FilterMode
  onChange: (filter: FilterMode) => void
}) {
  const options: { value: FilterMode; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: COLORS.total },
    { value: 'approved', label: 'Approved', color: COLORS.approved },
    { value: 'unapproved', label: 'Unapproved', color: COLORS.unapproved },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            filter === opt.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: opt.color }}
          />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Year range selector
function YearRangeSelector({
  years,
  selectedRange,
  onChange
}: {
  years: number[]
  selectedRange: [number, number]
  onChange: (range: [number, number]) => void
}) {
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange([minYear, maxYear])}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="Reset range"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2">
        <select
          value={selectedRange[0]}
          onChange={(e) => onChange([Number(e.target.value), selectedRange[1]])}
          className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.filter(y => y <= selectedRange[1]).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <span className="text-gray-400">to</span>
        <select
          value={selectedRange[1]}
          onChange={(e) => onChange([selectedRange[0], Number(e.target.value)])}
          className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.filter(y => y >= selectedRange[0]).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label, viewMode }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-lg rounded-lg p-3 border border-gray-200"
    >
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
      {viewMode === 'monthly' && payload[0]?.payload?.documents && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          Click to view {payload[0].payload.documents.length} CRLs
        </div>
      )}
    </motion.div>
  )
}

// Document list panel
function DocumentListPanel({
  documents,
  month,
  onClose,
  onViewDocument
}: {
  documents: CRLDocument[]
  month: string
  onClose: () => void
  onViewDocument: (hash: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 max-h-96 overflow-auto"
    >
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b border-gray-100">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          {month}
        </h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {documents.map(doc => (
          <div
            key={doc.file_hash}
            onClick={() => onViewDocument(doc.file_hash)}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {doc.drug_name || doc.application_number}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                    doc.approval_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {doc.approval_status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {doc.application_type} {doc.application_number} • {doc.therapeutic_area}
                </div>
              </div>
              <FileText className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Stats summary component
function TimelineStats({ data, filter }: { data: YearlyData[]; filter: FilterMode }) {
  const totals = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.total, 0)
    const approved = data.reduce((sum, d) => sum + d.approved, 0)
    const unapproved = data.reduce((sum, d) => sum + d.unapproved, 0)
    const avgRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0'

    // Find peak year
    const peakYear = data.reduce((peak, d) => d.total > (peak?.total || 0) ? d : peak, data[0])

    return { total, approved, unapproved, avgRate, peakYear }
  }, [data])

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs text-blue-600 uppercase font-semibold flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Total CRLs
        </div>
        <div className="text-2xl font-bold text-blue-700">{totals.total}</div>
      </div>
      <div className="bg-emerald-50 rounded-lg p-3">
        <div className="text-xs text-emerald-600 uppercase font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Approved
        </div>
        <div className="text-2xl font-bold text-emerald-700">{totals.approved}</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs text-gray-600 uppercase font-semibold flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Unapproved
        </div>
        <div className="text-2xl font-bold text-gray-700">{totals.unapproved}</div>
      </div>
      <div className="bg-purple-50 rounded-lg p-3">
        <div className="text-xs text-purple-600 uppercase font-semibold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Rescue Rate
        </div>
        <div className="text-2xl font-bold text-purple-700">{totals.avgRate}%</div>
      </div>
      <div className="bg-amber-50 rounded-lg p-3">
        <div className="text-xs text-amber-600 uppercase font-semibold flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Peak Year
        </div>
        <div className="text-2xl font-bold text-amber-700">
          {totals.peakYear?.year || '-'}
          <span className="text-sm font-normal text-amber-600 ml-1">
            ({totals.peakYear?.total || 0})
          </span>
        </div>
      </div>
    </div>
  )
}

// Main component
export default function TimelineExplorer() {
  const [documents, setDocuments] = useState<CRLDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [yearRange, setYearRange] = useState<[number, number]>([2018, 2025])
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null)

  // Load data
  useEffect(() => {
    fetch('/data/enriched_crls.json')
      .then(res => res.json())
      .then((data: CRLDocument[]) => {
        setDocuments(data)

        // Determine year range from data
        const years = data
          .map(d => parseLetterDate(d.letter_date)?.getFullYear())
          .filter((y): y is number => y !== null && y !== undefined)

        if (years.length > 0) {
          setYearRange([Math.min(...years), Math.max(...years)])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load CRL data:', err)
        setLoading(false)
      })
  }, [])

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    documents.forEach(doc => {
      const date = parseLetterDate(doc.letter_date)
      if (date) years.add(date.getFullYear())
    })
    return Array.from(years).sort()
  }, [documents])

  // Filter documents by year range and status
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const date = parseLetterDate(doc.letter_date)
      if (!date) return false

      const year = date.getFullYear()
      if (year < yearRange[0] || year > yearRange[1]) return false

      if (filter === 'approved' && doc.approval_status !== 'approved') return false
      if (filter === 'unapproved' && doc.approval_status === 'approved') return false

      return true
    })
  }, [documents, yearRange, filter])

  // Monthly data aggregation
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, MonthlyData>()

    // Initialize all months in range
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1)
        const key = `${year}-${String(month + 1).padStart(2, '0')}`
        monthMap.set(key, {
          month: key,
          monthLabel: formatMonth(date),
          year,
          total: 0,
          approved: 0,
          unapproved: 0,
          cumulative: 0,
          documents: [],
        })
      }
    }

    // Aggregate documents
    filteredDocuments.forEach(doc => {
      const date = parseLetterDate(doc.letter_date)
      if (!date) return

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const data = monthMap.get(key)
      if (data) {
        data.total++
        if (doc.approval_status === 'approved') {
          data.approved++
        } else {
          data.unapproved++
        }
        data.documents.push(doc)
      }
    })

    // Calculate cumulative and sort
    const sorted = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
    let cumulative = 0
    sorted.forEach(d => {
      cumulative += d.total
      d.cumulative = cumulative
    })

    return sorted
  }, [filteredDocuments, yearRange])

  // Yearly data aggregation
  const yearlyData = useMemo(() => {
    const yearMap = new Map<number, YearlyData>()

    filteredDocuments.forEach(doc => {
      const date = parseLetterDate(doc.letter_date)
      if (!date) return

      const year = date.getFullYear()
      const data = yearMap.get(year) || { year, total: 0, approved: 0, unapproved: 0, rescueRate: 0 }
      data.total++
      if (doc.approval_status === 'approved') {
        data.approved++
      } else {
        data.unapproved++
      }
      data.rescueRate = data.total > 0 ? (data.approved / data.total) * 100 : 0
      yearMap.set(year, data)
    })

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year)
  }, [filteredDocuments])

  // Handle chart click
  const handleChartClick = useCallback((data: any) => {
    if (data?.activePayload?.[0]?.payload?.documents) {
      setSelectedMonth(data.activePayload[0].payload)
    }
  }, [])

  // Handle document view
  const handleViewDocument = useCallback((hash: string) => {
    window.open(`/document-view/${hash}`, '_blank')
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton type="stat" height={80} />
        <ChartSkeleton type="line" height={400} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header with controls */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              CRL Timeline
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track CRL submissions and outcomes over time
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <FilterToggle filter={filter} onChange={setFilter} />
          </div>
        </div>

        {/* Year range selector */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Date Range:</span>
          </div>
          <YearRangeSelector
            years={availableYears}
            selectedRange={yearRange}
            onChange={setYearRange}
          />
        </div>

        {/* Stats summary */}
        <TimelineStats data={yearlyData} filter={filter} />
      </div>

      {/* Main chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            {viewMode === 'monthly' && 'Monthly CRL Distribution'}
            {viewMode === 'yearly' && 'Yearly CRL Distribution'}
            {viewMode === 'cumulative' && 'Cumulative CRL Growth'}
          </h3>
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Clear selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className={`${selectedMonth ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResponsiveContainer width="100%" height={400}>
                  {viewMode === 'cumulative' ? (
                    <AreaChart
                      data={monthlyData}
                      onClick={handleChartClick}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                        tickFormatter={(v, i) => i % 6 === 0 ? v : ''}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke={COLORS.cumulative}
                        fill="rgba(139, 92, 246, 0.2)"
                        strokeWidth={2}
                        name="Cumulative Total"
                      />
                    </AreaChart>
                  ) : viewMode === 'yearly' ? (
                    <BarChart
                      data={yearlyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                      <Legend />
                      <Bar dataKey="approved" stackId="a" fill={COLORS.approved} name="Approved" />
                      <Bar dataKey="unapproved" stackId="a" fill={COLORS.unapproved} name="Unapproved" />
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={monthlyData}
                      onClick={handleChartClick}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                        tickFormatter={(v, i) => i % 6 === 0 ? v : ''}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        stackId="1"
                        stroke={COLORS.approved}
                        fill={COLORS.areaApproved}
                        name="Approved"
                      />
                      <Area
                        type="monotone"
                        dataKey="unapproved"
                        stackId="1"
                        stroke={COLORS.unapproved}
                        fill={COLORS.areaUnapproved}
                        name="Unapproved"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Selected month panel */}
          <AnimatePresence>
            {selectedMonth && (
              <DocumentListPanel
                documents={selectedMonth.documents}
                month={selectedMonth.monthLabel}
                onClose={() => setSelectedMonth(null)}
                onViewDocument={handleViewDocument}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Help text */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          {viewMode === 'monthly'
            ? 'Click on a month to see individual CRLs'
            : 'Use the view mode toggle to see different time perspectives'
          }
        </div>
      </div>

      {/* Insights panel */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Timeline Insights
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Data Collection Period</div>
            <p>
              The dataset spans from {yearRange[0]} to {yearRange[1]}, capturing the FDA's
              transparency initiative that began publishing CRLs publicly.
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Temporal Patterns</div>
            <p>
              CRL issuance varies throughout the year, with some months showing higher activity.
              The cumulative view shows steady growth in the public CRL database.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
