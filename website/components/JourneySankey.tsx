'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  Info,
  ArrowRight,
  Layers,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'
import { useDashboard } from '@/contexts/DashboardContext'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <ChartSkeleton type="bar" height={500} />
})

// Types
interface CRLDocument {
  file_hash: string
  drug_name: string
  application_type: string
  approval_status: 'approved' | 'unapproved'
  deficiency_categories: string[]
  therapeutic_area: string
}

interface SankeyNode {
  label: string
  color: string
}

interface SankeyLink {
  source: number
  target: number
  value: number
  color: string
}

interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

type ViewMode = 'app_type_first' | 'deficiency_first'

// Color constants
const COLORS = {
  // Application types
  NDA: '#3b82f6',       // Blue
  BLA: '#8b5cf6',       // Purple
  ANDA: '#06b6d4',      // Cyan
  Unknown: '#94a3b8',   // Gray

  // Deficiency categories
  labeling: '#f59e0b',
  safety: '#ef4444',
  cmc_manufacturing: '#10b981',
  efficacy: '#ec4899',
  statistical: '#6366f1',
  clinical_trial_design: '#14b8a6',
  bioequivalence: '#f97316',
  rems: '#84cc16',

  // Outcomes
  approved: '#059669',
  unapproved: '#64748b',

  // Link colors (semi-transparent)
  approvedLink: 'rgba(5, 150, 105, 0.4)',
  unapprovedLink: 'rgba(100, 116, 139, 0.4)',
}

const CATEGORY_LABELS: Record<string, string> = {
  labeling: 'Labeling',
  safety: 'Safety',
  cmc_manufacturing: 'CMC/Manufacturing',
  efficacy: 'Efficacy',
  statistical: 'Statistical',
  clinical_trial_design: 'Clinical Trial Design',
  bioequivalence: 'Bioequivalence',
  rems: 'REMS',
}

// View mode toggle component
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
        onClick={() => onChange('app_type_first')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'app_type_first'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        App Type First
      </button>
      <button
        onClick={() => onChange('deficiency_first')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'deficiency_first'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Deficiency First
      </button>
    </div>
  )
}

// Build Sankey data structure
function buildSankeyData(
  documents: CRLDocument[],
  viewMode: ViewMode,
  selectedCategories: string[]
): SankeyData {
  const nodes: SankeyNode[] = []
  const links: SankeyLink[] = []

  // Filter documents if categories are selected
  const filteredDocs = selectedCategories.length > 0
    ? documents.filter(doc =>
        doc.deficiency_categories.some(cat => selectedCategories.includes(cat))
      )
    : documents

  if (viewMode === 'app_type_first') {
    // Flow: Application Type -> Deficiency Category -> Outcome

    // Get unique app types
    const appTypes = [...new Set(filteredDocs.map(d => d.application_type || 'Unknown'))]
      .filter(t => t !== 'Unknown' || filteredDocs.some(d => !d.application_type))

    // Get active deficiency categories (that appear in filtered docs)
    const activeCategories = [...new Set(
      filteredDocs.flatMap(d => d.deficiency_categories)
    )].filter(cat =>
      selectedCategories.length === 0 || selectedCategories.includes(cat)
    )

    // Build nodes: [App Types] -> [Deficiency Categories] -> [Outcomes]
    // App type nodes
    appTypes.forEach(type => {
      nodes.push({
        label: type,
        color: COLORS[type as keyof typeof COLORS] || COLORS.Unknown
      })
    })

    const appTypeOffset = appTypes.length

    // Deficiency category nodes
    activeCategories.forEach(cat => {
      nodes.push({
        label: CATEGORY_LABELS[cat] || cat,
        color: COLORS[cat as keyof typeof COLORS] || '#94a3b8'
      })
    })

    const deficiencyOffset = appTypeOffset + activeCategories.length

    // Outcome nodes
    nodes.push({ label: 'Approved', color: COLORS.approved })
    nodes.push({ label: 'Unapproved', color: COLORS.unapproved })

    // Build links: App Type -> Deficiency
    const appToDefLinks: Map<string, number> = new Map()
    filteredDocs.forEach(doc => {
      const appType = doc.application_type || 'Unknown'
      const appIdx = appTypes.indexOf(appType)
      if (appIdx === -1) return

      doc.deficiency_categories.forEach(cat => {
        if (selectedCategories.length > 0 && !selectedCategories.includes(cat)) return
        const catIdx = activeCategories.indexOf(cat)
        if (catIdx === -1) return

        const key = `${appIdx}-${catIdx}`
        appToDefLinks.set(key, (appToDefLinks.get(key) || 0) + 1)
      })
    })

    appToDefLinks.forEach((value, key) => {
      const [appIdx, catIdx] = key.split('-').map(Number)
      links.push({
        source: appIdx,
        target: appTypeOffset + catIdx,
        value,
        color: 'rgba(148, 163, 184, 0.3)'
      })
    })

    // Build links: Deficiency -> Outcome
    const defToOutLinks: Map<string, { approved: number; unapproved: number }> = new Map()
    filteredDocs.forEach(doc => {
      doc.deficiency_categories.forEach(cat => {
        if (selectedCategories.length > 0 && !selectedCategories.includes(cat)) return
        const catIdx = activeCategories.indexOf(cat)
        if (catIdx === -1) return

        const key = `${catIdx}`
        const current = defToOutLinks.get(key) || { approved: 0, unapproved: 0 }
        if (doc.approval_status === 'approved') {
          current.approved++
        } else {
          current.unapproved++
        }
        defToOutLinks.set(key, current)
      })
    })

    defToOutLinks.forEach((value, key) => {
      const catIdx = Number(key)
      if (value.approved > 0) {
        links.push({
          source: appTypeOffset + catIdx,
          target: deficiencyOffset,
          value: value.approved,
          color: COLORS.approvedLink
        })
      }
      if (value.unapproved > 0) {
        links.push({
          source: appTypeOffset + catIdx,
          target: deficiencyOffset + 1,
          value: value.unapproved,
          color: COLORS.unapprovedLink
        })
      }
    })

  } else {
    // Flow: Deficiency Category -> Outcome (simpler 2-column view)

    // Get active deficiency categories
    const activeCategories = [...new Set(
      filteredDocs.flatMap(d => d.deficiency_categories)
    )].filter(cat =>
      selectedCategories.length === 0 || selectedCategories.includes(cat)
    ).sort((a, b) => {
      // Sort by total count descending
      const aCount = filteredDocs.filter(d => d.deficiency_categories.includes(a)).length
      const bCount = filteredDocs.filter(d => d.deficiency_categories.includes(b)).length
      return bCount - aCount
    })

    // Deficiency category nodes
    activeCategories.forEach(cat => {
      nodes.push({
        label: CATEGORY_LABELS[cat] || cat,
        color: COLORS[cat as keyof typeof COLORS] || '#94a3b8'
      })
    })

    const deficiencyOffset = activeCategories.length

    // Outcome nodes
    nodes.push({ label: 'Approved', color: COLORS.approved })
    nodes.push({ label: 'Unapproved', color: COLORS.unapproved })

    // Build links: Deficiency -> Outcome
    activeCategories.forEach((cat, catIdx) => {
      const docsWithCat = filteredDocs.filter(d => d.deficiency_categories.includes(cat))
      const approved = docsWithCat.filter(d => d.approval_status === 'approved').length
      const unapproved = docsWithCat.filter(d => d.approval_status !== 'approved').length

      if (approved > 0) {
        links.push({
          source: catIdx,
          target: deficiencyOffset,
          value: approved,
          color: COLORS.approvedLink
        })
      }
      if (unapproved > 0) {
        links.push({
          source: catIdx,
          target: deficiencyOffset + 1,
          value: unapproved,
          color: COLORS.unapprovedLink
        })
      }
    })
  }

  return { nodes, links }
}

// Calculate stats from filtered data
function calculateStats(documents: CRLDocument[], selectedCategories: string[]) {
  const filtered = selectedCategories.length > 0
    ? documents.filter(doc =>
        doc.deficiency_categories.some(cat => selectedCategories.includes(cat))
      )
    : documents

  const approved = filtered.filter(d => d.approval_status === 'approved').length
  const total = filtered.length
  const rescueRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0'

  return { total, approved, unapproved: total - approved, rescueRate }
}

// Category filter pills
function CategoryFilterPills({
  categories,
  selected,
  onToggle,
  onClear
}: {
  categories: Array<{ category: string; label: string; count: number; rescueRate: number }>
  selected: string[]
  onToggle: (cat: string) => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      {selected.length > 0 && (
        <button
          onClick={onClear}
          className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Clear
        </button>
      )}
      {categories.map(cat => (
        <button
          key={cat.category}
          onClick={() => onToggle(cat.category)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
            selected.includes(cat.category)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={`${cat.count} CRLs, ${cat.rescueRate}% rescue rate`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS[cat.category as keyof typeof COLORS] || '#94a3b8' }}
          />
          {cat.label}
        </button>
      ))}
    </div>
  )
}

// Main component
export default function JourneySankey() {
  const [documents, setDocuments] = useState<CRLDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('deficiency_first')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const { state: dashboardState, actions: dashboardActions } = useDashboard()

  // Load data
  useEffect(() => {
    fetch('/data/enriched_crls.json')
      .then(res => res.json())
      .then((data: CRLDocument[]) => {
        setDocuments(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load CRL data:', err)
        setLoading(false)
      })
  }, [])

  // Get unique categories with stats
  const categoryOptions = useMemo(() => {
    const catMap = new Map<string, { total: number; approved: number }>()

    documents.forEach(doc => {
      doc.deficiency_categories.forEach(cat => {
        const current = catMap.get(cat) || { total: 0, approved: 0 }
        current.total++
        if (doc.approval_status === 'approved') current.approved++
        catMap.set(cat, current)
      })
    })

    return Array.from(catMap.entries())
      .map(([category, stats]) => ({
        category,
        label: CATEGORY_LABELS[category] || category,
        count: stats.total,
        rescueRate: parseFloat(((stats.approved / stats.total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
  }, [documents])

  // Build Sankey data
  const sankeyData = useMemo(() => {
    if (documents.length === 0) return null
    return buildSankeyData(documents, viewMode, selectedCategories)
  }, [documents, viewMode, selectedCategories])

  // Calculate stats
  const stats = useMemo(() => {
    return calculateStats(documents, selectedCategories)
  }, [documents, selectedCategories])

  // Handle category toggle
  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedCategories([])
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton type="stat" height={80} />
        <ChartSkeleton type="bar" height={500} />
      </div>
    )
  }

  if (!sankeyData || sankeyData.nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500">No data available for visualization</p>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-500" />
              CRL Journey Flow
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Visualize the flow from deficiency types to approval outcomes
            </p>
          </div>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase font-semibold">Total CRLs</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-xs text-emerald-600 uppercase font-semibold">Approved</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.approved}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase font-semibold">Unapproved</div>
            <div className="text-2xl font-bold text-gray-700">{stats.unapproved}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-600 uppercase font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Rescue Rate
            </div>
            <div className="text-2xl font-bold text-blue-700">{stats.rescueRate}%</div>
          </div>
        </div>

        {/* Category filters */}
        <CategoryFilterPills
          categories={categoryOptions}
          selected={selectedCategories}
          onToggle={handleCategoryToggle}
          onClear={handleClearFilters}
        />
      </div>

      {/* Sankey diagram */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewMode}-${selectedCategories.join(',')}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plot
              data={[{
                type: 'sankey',
                orientation: 'h',
                node: {
                  pad: 20,
                  thickness: 25,
                  line: { color: 'white', width: 2 },
                  label: sankeyData.nodes.map(n => n.label),
                  color: sankeyData.nodes.map(n => n.color),
                  hovertemplate: '<b>%{label}</b><br>Total: %{value}<extra></extra>',
                },
                link: {
                  source: sankeyData.links.map(l => l.source),
                  target: sankeyData.links.map(l => l.target),
                  value: sankeyData.links.map(l => l.value),
                  color: sankeyData.links.map(l => l.color),
                  hovertemplate: '%{source.label} → %{target.label}<br>Count: %{value}<extra></extra>',
                },
              }]}
              layout={{
                font: { family: 'Inter, system-ui, sans-serif', size: 12 },
                margin: { l: 10, r: 10, t: 30, b: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                height: 500,
              }}
              config={{
                displayModeBar: true,
                modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
                displaylogo: false,
                responsive: true,
              }}
              style={{ width: '100%', height: '500px' }}
              useResizeHandler
            />
          </motion.div>
        </AnimatePresence>

        {/* Legend / Help text */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span>Flow width indicates number of CRLs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.approved }} />
              <span>Green flows = Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.unapproved }} />
              <span>Gray flows = Unapproved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Key Insights
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Highest Rescue Rate</div>
            <p>
              CMC/Manufacturing deficiencies have the highest rescue rate (~86%),
              suggesting these issues are most resolvable.
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">Most Common Issues</div>
            <p>
              Labeling and Safety deficiencies appear in the most CRLs,
              but still maintain ~68-70% rescue rates.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
