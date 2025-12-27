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
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LabelList,
  Cell,
} from 'recharts'
import { AlertCircle, CheckCircle2, ArrowUpDown, Filter, LayoutGrid, Columns2, Minus } from 'lucide-react'

interface DeficiencyData {
  categories: Array<{
    category: string
    category_label: string
    total: number
    approved: number
    unapproved: number
    rescue_rate: number
  }>
  cooccurrence: {
    categories: string[]
    matrix: number[][]
  }
  key_flags: Array<{
    flag: string
    label: string
    approved: number
    unapproved: number
    total: number
    impact_score: number
  }>
}

const COLORS = {
  approved: '#059669',
  unapproved: '#94a3b8',
  rescueRate: '#3b82f6',
  grid: '#e2e8f0',
  text: '#64748b',
  highlight: '#2563eb',
}

type SortMode = 'frequency' | 'rescue_rate' | 'alphabetical'
type ComparisonMode = 'stacked' | 'split' | 'difference'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

// Sort Controls Component
function SortControls({
  mode,
  onChange
}: {
  mode: SortMode
  onChange: (mode: SortMode) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-600">Sort:</span>
      <div className="flex gap-1">
        {[
          { value: 'frequency', label: 'Frequency' },
          { value: 'rescue_rate', label: 'Rescue Rate' },
          { value: 'alphabetical', label: 'A-Z' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value as SortMode)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              mode === option.value
                ? 'bg-slate-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Category Filter Pills
function CategoryFilters({
  categories,
  selected,
  onToggle
}: {
  categories: string[]
  selected: string[]
  onToggle: (cat: string) => void
}) {
  const allSelected = selected.length === categories.length

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-4 h-4 text-gray-400" />
      <button
        onClick={() => {
          if (!allSelected) {
            categories.forEach(c => {
              if (!selected.includes(c)) onToggle(c)
            })
          }
        }}
        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
          allSelected
            ? 'bg-slate-800 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onToggle(cat)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
            selected.includes(cat)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

// Comparison Mode Toggle
function ComparisonModeToggle({
  mode,
  onChange
}: {
  mode: ComparisonMode
  onChange: (mode: ComparisonMode) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange('stacked')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'stacked'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        title="Stacked bars"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Stacked
      </button>
      <button
        onClick={() => onChange('split')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'split'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        title="Side by side"
      >
        <Columns2 className="w-3.5 h-3.5" />
        Split
      </button>
      <button
        onClick={() => onChange('difference')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'difference'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        title="Show difference"
      >
        <Minus className="w-3.5 h-3.5" />
        Diff
      </button>
    </div>
  )
}

// Interactive Heatmap Component
function InteractiveHeatmap({
  categories,
  matrix,
  highlightedCategory,
  onCategoryHover
}: {
  categories: string[]
  matrix: number[][]
  highlightedCategory: string | null
  onCategoryHover: (cat: string | null) => void
}) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)

  // Format category labels
  const labels = categories.map(c =>
    c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').slice(0, 12)
  )

  // Find max value for color scaling
  const maxVal = Math.max(...matrix.flat().filter((_, i) => i % (categories.length + 1) !== 0))

  // Color scale function
  const getColor = (value: number, rowIdx: number, colIdx: number) => {
    if (rowIdx === colIdx) return '#f1f5f9' // Diagonal
    const intensity = Math.pow(value / maxVal, 0.6) // Non-linear scaling
    const r = Math.round(37 + (255 - 37) * (1 - intensity))
    const g = Math.round(99 + (255 - 99) * (1 - intensity))
    const b = Math.round(235 + (255 - 235) * (1 - intensity))
    return `rgb(${r}, ${g}, ${b})`
  }

  const cellSize = 48

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Header row */}
        <div className="flex" style={{ marginLeft: cellSize + 8 }}>
          {labels.map((label, i) => (
            <div
              key={i}
              className="flex items-end justify-center text-xs text-gray-600 font-medium"
              style={{ width: cellSize, height: 60 }}
            >
              <span
                className="origin-bottom-left transform -rotate-45 whitespace-nowrap"
                style={{ marginBottom: 4 }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {matrix.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center">
            {/* Row label */}
            <div
              className="text-xs text-gray-600 font-medium text-right pr-2 truncate"
              style={{ width: cellSize + 8 }}
            >
              {labels[rowIdx]}
            </div>

            {/* Cells */}
            {row.map((value, colIdx) => {
              const isHighlighted =
                (highlightedCategory === categories[rowIdx]) ||
                (highlightedCategory === categories[colIdx]) ||
                (hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx)
              const isHoveredCell = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx

              return (
                <motion.div
                  key={colIdx}
                  className="relative flex items-center justify-center cursor-pointer transition-all"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: getColor(value, rowIdx, colIdx),
                    opacity: highlightedCategory && !isHighlighted ? 0.4 : 1,
                    border: isHoveredCell ? '2px solid #1e40af' : '1px solid #e2e8f0',
                    borderRadius: 4,
                    margin: 1,
                  }}
                  onMouseEnter={() => {
                    setHoveredCell({ row: rowIdx, col: colIdx })
                    onCategoryHover(categories[rowIdx])
                  }}
                  onMouseLeave={() => {
                    setHoveredCell(null)
                    onCategoryHover(null)
                  }}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                >
                  {rowIdx !== colIdx && (
                    <span className={`text-xs font-semibold ${value > maxVal * 0.6 ? 'text-white' : 'text-gray-700'}`}>
                      {value}
                    </span>
                  )}

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHoveredCell && rowIdx !== colIdx && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50"
                      >
                        <div className="font-semibold">{labels[rowIdx]} + {labels[colIdx]}</div>
                        <div className="text-slate-300">{value} CRLs have both</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
        <span>Co-occurrence:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
          <span>Low</span>
        </div>
        <div className="w-20 h-3 rounded" style={{
          background: 'linear-gradient(to right, #e0e7ff, #6366f1, #2563eb)'
        }} />
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2563eb' }} />
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white shadow-xl rounded-lg p-4 border border-gray-200 min-w-[180px]"
    >
      <p className="font-semibold text-slate-800 border-b border-gray-100 pb-2 mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.approved }} />
            Approved
          </span>
          <span className="font-mono font-semibold">{data?.approved || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.unapproved }} />
            Unapproved
          </span>
          <span className="font-mono font-semibold">{data?.unapproved || 0}</span>
        </div>
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Rescue Rate</span>
          <span className="font-mono font-bold text-blue-600">{data?.rescue_rate || 0}%</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function DeficienciesDashboard() {
  const [data, setData] = useState<DeficiencyData | null>(null)
  const [loading, setLoading] = useState(true)

  // Interactive state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('frequency')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('stacked')
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/deficiencies.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setSelectedCategories(data.categories.map((c: any) => c.category_label))
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load deficiency data:', err)
        setLoading(false)
      })
  }, [])

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev // Keep at least one
        return prev.filter(c => c !== cat)
      }
      return [...prev, cat]
    })
  }, [])

  // Filtered and sorted data
  const { frequencyData, rescueData, radarData, allCategoryLabels } = useMemo(() => {
    if (!data) return { frequencyData: [], rescueData: [], radarData: [], allCategoryLabels: [] }

    const allCategoryLabels = data.categories.map(c => c.category_label)

    // Filter by selected categories
    let filtered = data.categories.filter(c => selectedCategories.includes(c.category_label))

    // Sort based on mode
    filtered = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'frequency':
          return b.total - a.total
        case 'rescue_rate':
          return b.rescue_rate - a.rescue_rate
        case 'alphabetical':
          return a.category_label.localeCompare(b.category_label)
        default:
          return 0
      }
    })

    const frequencyData = filtered.map(cat => ({
      name: cat.category_label,
      total: cat.total,
      approved: cat.approved,
      unapproved: cat.unapproved,
      rescue_rate: cat.rescue_rate,
      difference: cat.approved - cat.unapproved,
      category: cat.category,
    }))

    const rescueData = [...filtered]
      .sort((a, b) => b.rescue_rate - a.rescue_rate)
      .map(cat => ({
        name: cat.category_label,
        rescue_rate: cat.rescue_rate,
        category: cat.category,
      }))

    const radarData = filtered.slice(0, 6).map(cat => ({
      category: cat.category_label.split(' ').slice(0, 2).join(' '),
      frequency: Math.round((cat.total / 300) * 100),
      rescue_rate: cat.rescue_rate,
    }))

    return { frequencyData, rescueData, radarData, allCategoryLabels }
  }, [data, selectedCategories, sortMode])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
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
      className="space-y-12 max-w-5xl mx-auto"
    >
      {/* SECTION 1: Frequency */}
      <motion.section variants={itemVariants}>
        <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deficiency Frequency</h2>
            <p className="text-gray-500 text-sm">Most common issues cited in CRLs, broken down by final approval outcome.</p>
          </div>
          <div className="flex items-center gap-4">
            <SortControls mode={sortMode} onChange={setSortMode} />
            <ComparisonModeToggle mode={comparisonMode} onChange={setComparisonMode} />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-4">
          <CategoryFilters
            categories={allCategoryLabels}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${sortMode}-${comparisonMode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={Math.max(300, frequencyData.length * 50 + 60)}>
                {comparisonMode === 'difference' ? (
                  <BarChart
                    layout="vertical"
                    data={frequencyData}
                    margin={{ top: 20, right: 40, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke={COLORS.grid} />
                    <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={110}
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar
                      dataKey="difference"
                      name="Difference (Appr - Unappr)"
                      barSize={24}
                      radius={4}
                      isAnimationActive={true}
                      animationDuration={500}
                    >
                      {frequencyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.difference >= 0 ? COLORS.approved : '#ef4444'}
                        />
                      ))}
                      <LabelList
                        dataKey="difference"
                        position="right"
                        fill={COLORS.text}
                        fontSize={11}
                        formatter={(val: number) => (val >= 0 ? `+${val}` : val)}
                      />
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart
                    layout="vertical"
                    data={frequencyData}
                    margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                    onMouseMove={(state: any) => {
                      if (state?.activeLabel) {
                        setHighlightedCategory(state.activeLabel)
                      }
                    }}
                    onMouseLeave={() => setHighlightedCategory(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={110}
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    <Bar
                      dataKey="approved"
                      name="Approved"
                      stackId={comparisonMode === 'stacked' ? 'a' : undefined}
                      fill={COLORS.approved}
                      barSize={comparisonMode === 'split' ? 12 : 24}
                      radius={comparisonMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 4, 4]}
                      isAnimationActive={true}
                      animationDuration={500}
                    >
                      {frequencyData.map((entry, index) => (
                        <Cell
                          key={`cell-approved-${index}`}
                          fill={COLORS.approved}
                          opacity={highlightedCategory && highlightedCategory !== entry.name ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="unapproved"
                      name="Unapproved"
                      stackId={comparisonMode === 'stacked' ? 'a' : undefined}
                      fill={COLORS.unapproved}
                      barSize={comparisonMode === 'split' ? 12 : 24}
                      radius={comparisonMode === 'stacked' ? [0, 4, 4, 0] : [4, 4, 4, 4]}
                      isAnimationActive={true}
                      animationDuration={500}
                    >
                      {frequencyData.map((entry, index) => (
                        <Cell
                          key={`cell-unapproved-${index}`}
                          fill={COLORS.unapproved}
                          opacity={highlightedCategory && highlightedCategory !== entry.name ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* SECTION 2: Rescue Rates */}
      <motion.section variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Rescue Rates</h2>
          <p className="text-gray-500 text-sm">Percentage of CRLs with specific deficiencies that were eventually approved.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={rescueData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                interval={0}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={5}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value}%`, 'Rescue Rate']}
              />
              <Bar
                dataKey="rescue_rate"
                name="Rescue Rate"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={600}
              >
                {rescueData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rescue_rate >= 80 ? COLORS.approved : entry.rescue_rate >= 70 ? COLORS.rescueRate : '#f59e0b'}
                  />
                ))}
                <LabelList
                  dataKey="rescue_rate"
                  position="top"
                  formatter={(val: number) => `${val}%`}
                  fill={COLORS.text}
                  fontSize={10}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md"
          >
            <h4 className="text-sm font-bold text-blue-900 uppercase mb-2">Key Insights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>CMC/Manufacturing</strong> issues have the highest rescue rate (~86%).</li>
              <li>• <strong>Safety</strong> and <strong>Labeling</strong> issues are harder to resolve (~69% rescue rate).</li>
              <li>• This suggests manufacturing issues are often technical hurdles, while safety concerns are fundamental.</li>
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 3: Key Flags */}
      <motion.section variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Critical Indicators</h2>
          <p className="text-gray-500 text-sm">Specific terms in CRLs that strongly correlate with final outcomes.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {data.key_flags.map((flag, idx) => {
            const isHighImpact = flag.impact_score > 50
            return (
              <motion.div
                key={flag.flag}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className={`p-5 rounded-lg border transition-all cursor-pointer ${
                  isHighImpact
                    ? 'border-red-200 bg-red-50 hover:shadow-md'
                    : 'border-green-200 bg-green-50 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isHighImpact ? <AlertCircle className="text-red-500" size={20} /> : <CheckCircle2 className="text-green-500" size={20} />}
                    <h4 className="font-bold text-gray-900">{flag.label}</h4>
                  </div>
                  <span className={`text-2xl font-bold ${isHighImpact ? 'text-red-600' : 'text-green-600'}`}>
                    {flag.impact_score}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Unapproval Rate</p>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-white/60 p-2 rounded">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-semibold">{flag.total}</div>
                  </div>
                  <div className="bg-white/60 p-2 rounded">
                    <div className="text-xs text-gray-500">Apprv</div>
                    <div className="font-semibold text-green-600">{flag.approved}</div>
                  </div>
                  <div className="bg-white/60 p-2 rounded">
                    <div className="text-xs text-gray-500">Unapprv</div>
                    <div className="font-semibold text-red-600">{flag.unapproved}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* SECTION 4: Radar & Interactive Heatmap */}
      <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Deficiency Profile</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Frequency %"
                  dataKey="frequency"
                  stroke={COLORS.rescueRate}
                  fill={COLORS.rescueRate}
                  fillOpacity={0.3}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Radar
                  name="Rescue Rate %"
                  dataKey="rescue_rate"
                  stroke={COLORS.approved}
                  fill={COLORS.approved}
                  fillOpacity={0.3}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Co-occurrence Heatmap</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[400px] overflow-auto">
            <InteractiveHeatmap
              categories={data.cooccurrence.categories}
              matrix={data.cooccurrence.matrix}
              highlightedCategory={highlightedCategory}
              onCategoryHover={setHighlightedCategory}
            />
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}
