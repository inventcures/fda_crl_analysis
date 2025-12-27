'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Search, X, Map, Layers, Palette, FileText, ExternalLink } from 'lucide-react'
import type { Datum } from 'plotly.js'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface EmbeddingPoint {
  file_hash: string
  drug_name: string
  application_number: string
  approval_status: 'approved' | 'unapproved' | string
  therapeutic_area: string
  deficiency_categories: string[]
  letter_date: string
  tsne_x: number
  tsne_y: number
  umap_x: number
  umap_y: number
  cluster: number
  severity_score: number
}

interface EmbeddingData {
  points: EmbeddingPoint[]
  metadata: {
    total_documents: number
    clusters: number
    therapeutic_areas: string[]
    has_umap: boolean
  }
}

type ColorMode = 'approval' | 'therapeutic_area' | 'severity' | 'cluster'
type ProjectionMethod = 'tsne' | 'umap'

const COLORS = {
  approved: '#10b981',
  unapproved: '#6b7280',
  therapeutic: {
    oncology: '#ef4444',
    cardiology: '#3b82f6',
    neurology: '#8b5cf6',
    unknown: '#94a3b8',
  },
  clusters: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  severity: {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  },
}

// Color mode toggle
function ColorModeToggle({
  mode,
  onChange
}: {
  mode: ColorMode
  onChange: (mode: ColorMode) => void
}) {
  const options: { value: ColorMode; label: string; icon: React.ReactNode }[] = [
    { value: 'approval', label: 'Outcome', icon: <Eye className="w-3.5 h-3.5" /> },
    { value: 'therapeutic_area', label: 'Area', icon: <Layers className="w-3.5 h-3.5" /> },
    { value: 'severity', label: 'Severity', icon: <Palette className="w-3.5 h-3.5" /> },
    { value: 'cluster', label: 'Cluster', icon: <Map className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === opt.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

// Projection method toggle
function ProjectionToggle({
  method,
  onChange
}: {
  method: ProjectionMethod
  onChange: (method: ProjectionMethod) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange('tsne')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          method === 'tsne'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        t-SNE
      </button>
      <button
        onClick={() => onChange('umap')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          method === 'umap'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        UMAP
      </button>
    </div>
  )
}

// Selected points panel
function SelectedPanel({
  points,
  onClear,
  onViewDocument
}: {
  points: EmbeddingPoint[]
  onClear: () => void
  onViewDocument: (hash: string) => void
}) {
  if (points.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-48 overflow-auto z-10"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          Selected Documents ({points.length})
        </h4>
        <button
          onClick={onClear}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>
      <div className="space-y-2">
        {points.slice(0, 5).map(point => (
          <div
            key={point.file_hash}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onViewDocument(point.file_hash)}
          >
            <div>
              <div className="font-medium text-gray-800">{point.drug_name}</div>
              <div className="text-xs text-gray-500">
                {point.therapeutic_area} • {point.approval_status}
              </div>
            </div>
            <ExternalLink size={14} className="text-gray-400" />
          </div>
        ))}
        {points.length > 5 && (
          <div className="text-xs text-gray-500 text-center">
            +{points.length - 5} more documents
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Legend component
function ColorLegend({ mode }: { mode: ColorMode }) {
  const legendItems = useMemo(() => {
    switch (mode) {
      case 'approval':
        return [
          { color: COLORS.approved, label: 'Approved' },
          { color: COLORS.unapproved, label: 'Unapproved' },
        ]
      case 'therapeutic_area':
        return Object.entries(COLORS.therapeutic).map(([area, color]) => ({
          color,
          label: area.charAt(0).toUpperCase() + area.slice(1),
        }))
      case 'cluster':
        return COLORS.clusters.map((color, i) => ({
          color,
          label: `Cluster ${i + 1}`,
        }))
      case 'severity':
        return [
          { color: COLORS.severity.low, label: 'Low' },
          { color: COLORS.severity.medium, label: 'Medium' },
          { color: COLORS.severity.high, label: 'High' },
        ]
      default:
        return []
    }
  }, [mode])

  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {legendItems.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function EmbeddingExplorer() {
  const router = useRouter()
  const [data, setData] = useState<EmbeddingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Interactive state
  const [colorMode, setColorMode] = useState<ColorMode>('approval')
  const [projectionMethod, setProjectionMethod] = useState<ProjectionMethod>('tsne')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPoints, setSelectedPoints] = useState<EmbeddingPoint[]>([])

  useEffect(() => {
    fetch('/data/embedding_projections.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load projections')
        return res.json()
      })
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load embedding data:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Get point color based on mode
  const getPointColor = useCallback((point: EmbeddingPoint): string => {
    switch (colorMode) {
      case 'approval':
        return point.approval_status === 'approved' ? COLORS.approved : COLORS.unapproved
      case 'therapeutic_area':
        return COLORS.therapeutic[point.therapeutic_area as keyof typeof COLORS.therapeutic] || COLORS.therapeutic.unknown
      case 'cluster':
        return COLORS.clusters[point.cluster % COLORS.clusters.length]
      case 'severity':
        if (point.severity_score < 0.33) return COLORS.severity.low
        if (point.severity_score < 0.66) return COLORS.severity.medium
        return COLORS.severity.high
      default:
        return '#94a3b8'
    }
  }, [colorMode])

  // Check if point matches search
  const matchesSearch = useCallback((point: EmbeddingPoint): boolean => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      point.drug_name.toLowerCase().includes(query) ||
      point.application_number.toLowerCase().includes(query) ||
      point.therapeutic_area.toLowerCase().includes(query) ||
      point.deficiency_categories.some(c => c.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Prepare plot data
  const plotData = useMemo(() => {
    if (!data) return []

    const x = data.points.map(p => projectionMethod === 'tsne' ? p.tsne_x : p.umap_x)
    const y = data.points.map(p => projectionMethod === 'tsne' ? p.tsne_y : p.umap_y)
    const colors = data.points.map(p => getPointColor(p))
    const sizes = data.points.map(p => matchesSearch(p) ? 12 : 6)
    const opacities = data.points.map(p => matchesSearch(p) ? 0.85 : 0.25)

    const hoverText = data.points.map(p =>
      `<b>${p.drug_name}</b><br>` +
      `Status: ${p.approval_status}<br>` +
      `Area: ${p.therapeutic_area}<br>` +
      `Date: ${p.letter_date || 'Unknown'}<br>` +
      `Deficiencies: ${p.deficiency_categories.length}`
    )

    // Store indices as customdata for type compatibility
    const indices = data.points.map((_, i) => i)

    return [{
      type: 'scatter' as const,
      mode: 'markers' as const,
      x,
      y,
      marker: {
        color: colors,
        size: sizes,
        opacity: opacities,
        line: {
          color: 'white',
          width: 1
        }
      },
      text: hoverText,
      hoverinfo: 'text' as const,
      customdata: indices as Datum[],
    }]
  }, [data, projectionMethod, getPointColor, matchesSearch])

  // Handle point click
  const handleClick = useCallback((event: any) => {
    if (event.points && event.points.length > 0 && data) {
      const index = event.points[0].customdata as number
      const point = data.points[index]
      router.push(`/document-view/${point.file_hash}`)
    }
  }, [router, data])

  // Handle lasso/box select
  const handleSelected = useCallback((event: any) => {
    if (event.points && event.points.length > 0 && data) {
      const selected = event.points.map((p: any) => data.points[p.customdata as number])
      setSelectedPoints(selected)
    }
  }, [data])

  const handleViewDocument = useCallback((hash: string) => {
    router.push(`/document-view/${hash}`)
  }, [router])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading embedding visualization...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 h-[600px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Failed to load embedding data</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProjectionToggle method={projectionMethod} onChange={setProjectionMethod} />
          <ColorModeToggle mode={colorMode} onChange={setColorMode} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search drugs, areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <ColorLegend mode={colorMode} />

      {/* Plot */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative">
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            height: 550,
            margin: { t: 30, r: 30, b: 40, l: 40 },
            xaxis: {
              title: 'Dimension 1',
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            yaxis: {
              title: 'Dimension 2',
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            hovermode: 'closest',
            dragmode: 'pan',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(248,250,252,1)',
          }}
          config={{
            scrollZoom: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['autoScale2d', 'resetScale2d'],
            displaylogo: false,
            responsive: true,
          }}
          onClick={handleClick}
          onSelected={handleSelected}
          style={{ width: '100%' }}
        />

        {/* Selected points panel */}
        <AnimatePresence>
          {selectedPoints.length > 0 && (
            <SelectedPanel
              points={selectedPoints}
              onClear={() => setSelectedPoints([])}
              onViewDocument={handleViewDocument}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {data.metadata.total_documents} documents • {data.metadata.clusters} clusters
        </span>
        <span>
          Click a point to view document • Drag to pan • Scroll to zoom • Box/Lasso select for multiple
        </span>
      </div>
    </div>
  )
}
