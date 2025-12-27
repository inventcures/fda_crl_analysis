'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, BarChart3, Percent, Hash, Filter, Calendar } from 'lucide-react'

interface OverviewData {
  summary: {
    total_crls: number
    approved: number
    unapproved: number
    approval_rate: number
  }
  application_types: {
    [key: string]: {
      total: number
      approved: number
      unapproved: number
      approval_rate: number
    }
  }
  yearly_trends: Array<{
    year: string
    approved: number
    unapproved: number
    total: number
  }>
}

const COLORS = {
  approved: '#059669',
  unapproved: '#94a3b8',
  total: '#1e293b',
  highlight: '#2563eb',
}

type ViewMode = 'absolute' | 'percentage'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

// Stat Card with count-up animation
function StatCard({
  label,
  value,
  suffix = '',
  color = 'text-slate-800',
  icon: Icon,
  delay = 0
}: {
  label: string
  value: number
  suffix?: string
  color?: string
  icon?: React.ComponentType<{ className?: string }>
  delay?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const stepDuration = duration / steps
    const increment = value / steps
    let current = 0

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(interval)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, stepDuration)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <div className={`text-3xl font-bold font-mono ${color}`}>
        {displayValue.toLocaleString()}{suffix}
      </div>
    </motion.div>
  )
}

// Year Range Slider Component
function YearRangeSlider({
  min,
  max,
  value,
  onChange
}: {
  min: number
  max: number
  value: [number, number]
  onChange: (range: [number, number]) => void
}) {
  const years = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-600">Year Range:</span>
      <div className="flex items-center gap-1">
        <select
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
          className="px-2 py-1 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {years.filter(y => y <= value[1]).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-gray-400">–</span>
        <select
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
          className="px-2 py-1 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {years.filter(y => y >= value[0]).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// App Type Toggle Pills
function AppTypeToggles({
  types,
  selected,
  onToggle
}: {
  types: string[]
  selected: string[]
  onToggle: (type: string) => void
}) {
  const allSelected = selected.length === types.length

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-600">Filter:</span>
      <button
        onClick={() => {
          if (allSelected) {
            // Can't deselect all - keep all selected
          } else {
            types.forEach(t => {
              if (!selected.includes(t)) onToggle(t)
            })
          }
        }}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
          allSelected
            ? 'bg-slate-800 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {types.map(type => (
        <button
          key={type}
          onClick={() => onToggle(type)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
            selected.includes(type)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  )
}

// View Mode Toggle
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
        onClick={() => onChange('absolute')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'absolute'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Hash className="w-3.5 h-3.5" />
        Counts
      </button>
      <button
        onClick={() => onChange('percentage')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'percentage'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Percent className="w-3.5 h-3.5" />
        Rates
      </button>
    </div>
  )
}

// Custom Tooltip with rich context
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  const total = (data?.approved || 0) + (data?.unapproved || 0)
  const rate = total > 0 ? ((data?.approved || 0) / total * 100).toFixed(1) : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white shadow-xl rounded-lg p-4 border border-gray-200 min-w-[180px]"
    >
      <p className="font-semibold text-lg text-slate-800 border-b border-gray-100 pb-2 mb-2">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.approved }} />
            Approved
          </span>
          <span className="font-mono font-semibold">{data?.approved || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.unapproved }} />
            Unapproved
          </span>
          <span className="font-mono font-semibold">{data?.unapproved || 0}</span>
        </div>
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Approval Rate</span>
          <span className="font-mono font-bold text-emerald-600">{rate}%</span>
        </div>
      </div>
    </motion.div>
  )
}

function CustomLineTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white shadow-xl rounded-lg p-4 border border-gray-200 min-w-[160px]"
    >
      <p className="font-semibold text-lg text-slate-800 border-b border-gray-100 pb-2 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function OverviewDashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  // Interactive state
  const [yearRange, setYearRange] = useState<[number, number]>([2020, 2025])
  const [selectedAppTypes, setSelectedAppTypes] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('absolute')
  const [highlightedYear, setHighlightedYear] = useState<string | null>(null)
  const [highlightedAppType, setHighlightedAppType] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/overview.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        // Initialize selected app types to all
        const types = Object.keys(data.application_types).filter(t => t)
        setSelectedAppTypes(types)

        // Set year range from data
        if (data.yearly_trends.length > 0) {
          const years = data.yearly_trends.map((t: any) => parseInt(t.year))
          setYearRange([Math.min(...years), Math.max(...years)])
        }

        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load overview data:', err)
        setLoading(false)
      })
  }, [])

  const toggleAppType = useCallback((type: string) => {
    setSelectedAppTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev
        return prev.filter(t => t !== type)
      }
      return [...prev, type]
    })
  }, [])

  // Filtered and transformed data
  const { appTypeData, filteredTrends, filteredSummary, allAppTypes } = useMemo(() => {
    if (!data) return { appTypeData: [], filteredTrends: [], filteredSummary: null, allAppTypes: [] }

    const allAppTypes = Object.keys(data.application_types).filter(t => t).sort()

    // Filter app types
    const filteredAppTypes = Object.entries(data.application_types)
      .filter(([type]) => type && selectedAppTypes.includes(type))
      .map(([type, stats]) => {
        const total = stats.approved + stats.unapproved
        return {
          name: type,
          approved: viewMode === 'percentage' ? (total > 0 ? (stats.approved / total) * 100 : 0) : stats.approved,
          unapproved: viewMode === 'percentage' ? (total > 0 ? (stats.unapproved / total) * 100 : 0) : stats.unapproved,
          total: stats.total,
          approval_rate: stats.approval_rate,
          rawApproved: stats.approved,
          rawUnapproved: stats.unapproved,
        }
      })
      .sort((a, b) => b.total - a.total)

    // Filter trends by year
    const filteredTrends = data.yearly_trends.filter(t => {
      const year = parseInt(t.year)
      return year >= yearRange[0] && year <= yearRange[1]
    })

    // Calculate filtered summary
    const filteredSummary = {
      total: filteredAppTypes.reduce((sum, t) => sum + t.total, 0),
      approved: filteredAppTypes.reduce((sum, t) => sum + t.rawApproved, 0),
      unapproved: filteredAppTypes.reduce((sum, t) => sum + t.rawUnapproved, 0),
    }

    return { appTypeData: filteredAppTypes, filteredTrends, filteredSummary, allAppTypes }
  }, [data, selectedAppTypes, yearRange, viewMode])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total CRLs"
          value={filteredSummary?.total || data.summary.total_crls}
          icon={BarChart3}
          delay={0}
        />
        <StatCard
          label="Eventually Approved"
          value={filteredSummary?.approved || data.summary.approved}
          color="text-emerald-600"
          icon={TrendingUp}
          delay={100}
        />
        <StatCard
          label="Approval Rate"
          value={Math.round(((filteredSummary?.approved || data.summary.approved) / (filteredSummary?.total || data.summary.total_crls)) * 100)}
          suffix="%"
          color="text-blue-600"
          icon={Percent}
          delay={200}
        />
      </div>

      {/* SECTION 1: Approval Outcomes by Application Type */}
      <motion.section variants={itemVariants}>
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Outcomes by Application Type</h2>
            <p className="text-gray-500 text-sm">Comparing volume and approval success across different submission types.</p>
          </div>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Filter Controls */}
        <div className="mb-4">
          <AppTypeToggles
            types={allAppTypes}
            selected={selectedAppTypes}
            onToggle={toggleAppType}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={Math.max(200, appTypeData.length * 50 + 60)}>
                <BarChart
                  layout="vertical"
                  data={appTypeData}
                  margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                  onMouseMove={(state: any) => {
                    if (state?.activeLabel) {
                      setHighlightedAppType(state.activeLabel)
                    }
                  }}
                  onMouseLeave={() => setHighlightedAppType(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={viewMode === 'percentage' ? (v) => `${v.toFixed(0)}%` : undefined}
                    domain={viewMode === 'percentage' ? [0, 100] : undefined}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#334155', fontSize: 13, fontWeight: 500 }}
                    width={60}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomBarTooltip />}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar
                    dataKey="approved"
                    name="Approved"
                    stackId="a"
                    fill={COLORS.approved}
                    barSize={28}
                    radius={[0, 0, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {appTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-approved-${index}`}
                        fill={COLORS.approved}
                        opacity={highlightedAppType && highlightedAppType !== entry.name ? 0.4 : 1}
                      />
                    ))}
                    {viewMode === 'absolute' && (
                      <LabelList
                        dataKey="approved"
                        position="center"
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                        formatter={(val: number) => val > 5 ? val : ''}
                      />
                    )}
                  </Bar>
                  <Bar
                    dataKey="unapproved"
                    name="Unapproved"
                    stackId="a"
                    fill={COLORS.unapproved}
                    barSize={28}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {appTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-unapproved-${index}`}
                        fill={COLORS.unapproved}
                        opacity={highlightedAppType && highlightedAppType !== entry.name ? 0.4 : 1}
                      />
                    ))}
                    {viewMode === 'absolute' && (
                      <LabelList
                        dataKey="unapproved"
                        position="center"
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                        formatter={(val: number) => val > 5 ? val : ''}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>

          {viewMode === 'percentage' && (
            <p className="mt-3 text-xs text-gray-500 text-center">
              Showing approval rates (%) for each application type
            </p>
          )}
        </div>
      </motion.section>

      {/* SECTION 2: Temporal Trends */}
      {data.yearly_trends.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Yearly Submission Trends</h2>
              <p className="text-gray-500 text-sm">Tracking CRL volume and subsequent approvals over time.</p>
            </div>
            <YearRangeSlider
              min={Math.min(...data.yearly_trends.map(t => parseInt(t.year)))}
              max={Math.max(...data.yearly_trends.map(t => parseInt(t.year)))}
              value={yearRange}
              onChange={setYearRange}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={filteredTrends}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                onMouseMove={(state: any) => {
                  if (state?.activeLabel) {
                    setHighlightedYear(state.activeLabel)
                  }
                }}
                onMouseLeave={() => setHighlightedYear(null)}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="plainline" />

                {highlightedYear && (
                  <ReferenceLine
                    x={highlightedYear}
                    stroke={COLORS.highlight}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total CRLs"
                  stroke={COLORS.total}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke={COLORS.approved}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.approved, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, stroke: COLORS.approved, strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="unapproved"
                  name="Unapproved"
                  stroke={COLORS.unapproved}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.unapproved, strokeWidth: 2, stroke: '#fff' }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-sm text-gray-500 bg-blue-50 p-3 rounded-md border-l-4 border-blue-500"
            >
              <strong>Note:</strong> Lower approval counts in recent years (2024-2025) reflect the lag time between receiving a CRL and resubmitting/gaining approval, rather than a decrease in approval rates.
            </motion.p>
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}
