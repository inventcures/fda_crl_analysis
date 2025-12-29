'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  ChevronDown,
  Info,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

// Types
interface SentimentDataPoint {
  position: number
  polarity: number
  subjectivity: number
  severity: number
}

interface TrajectoryDocument {
  doc_id: string
  drug_name: string
  approval_status: 'approved' | 'unapproved'
  sentence_count: number
  data: SentimentDataPoint[]
  smoothed: {
    polarity: number[]
    subjectivity: number[]
    severity: number[]
  }
  summary: {
    mean_polarity: number
    mean_subjectivity: number
    mean_severity: number
    polarity_trend: number
  }
}

interface SentimentAggregate {
  approved: {
    mean_polarity: number
    mean_severity: number
    count: number
  }
  unapproved: {
    mean_polarity: number
    mean_severity: number
    count: number
  }
}

interface SentimentData {
  sentiment_trajectories: TrajectoryDocument[]
  sentiment_aggregate: SentimentAggregate
}

type MetricType = 'polarity' | 'severity' | 'subjectivity'

const COLORS = {
  approved: '#059669',
  unapproved: '#64748b',
  polarity: '#3b82f6',
  severity: '#ef4444',
  subjectivity: '#8b5cf6',
  positive: '#10b981',
  negative: '#f43f5e',
  grid: '#e2e8f0',
  text: '#64748b',
}

// Document selector dropdown
function DocumentSelector({
  documents,
  selectedId,
  onSelect
}: {
  documents: TrajectoryDocument[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = documents.find(d => d.doc_id === selectedId)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors min-w-[200px]"
      >
        <FileText className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left text-sm truncate">
          {selected ? selected.drug_name : 'Select document...'}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          selected?.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {selected?.approval_status || ''}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-auto"
          >
            {documents.map((doc) => (
              <button
                key={doc.doc_id}
                onClick={() => {
                  onSelect(doc.doc_id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  selectedId === doc.doc_id ? 'bg-blue-50' : ''
                }`}
              >
                <span className="flex-1 text-sm truncate">{doc.drug_name}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  doc.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {doc.approval_status}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Metric toggle
function MetricToggle({
  metric,
  onChange
}: {
  metric: MetricType
  onChange: (metric: MetricType) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange('polarity')}
        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          metric === 'polarity'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Polarity
      </button>
      <button
        onClick={() => onChange('severity')}
        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          metric === 'severity'
            ? 'bg-red-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Severity
      </button>
      <button
        onClick={() => onChange('subjectivity')}
        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          metric === 'subjectivity'
            ? 'bg-purple-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Subjectivity
      </button>
    </div>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-200 min-w-[140px]">
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-2 mb-2">
        Sentence {label}
      </p>
      <div className="space-y-1.5 text-sm">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-mono font-semibold">{entry.value?.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Summary stat card
function SummaryStat({
  label,
  value,
  trend,
  color
}: {
  label: string
  value: number
  trend?: number
  color: string
}) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold" style={{ color }}>{value.toFixed(3)}</span>
        {trend !== undefined && (
          <span className={`text-xs flex items-center gap-0.5 ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {trend > 0 ? '+' : ''}{(trend * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

// Main component
export default function InteractiveSentimentTrajectory() {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [metric, setMetric] = useState<MetricType>('polarity')
  const [showSmoothed, setShowSmoothed] = useState(true)

  // Load data
  useEffect(() => {
    fetch('/data/topic_sentiment_data.json')
      .then(res => res.json())
      .then((fullData) => {
        setData({
          sentiment_trajectories: fullData.sentiment_trajectories,
          sentiment_aggregate: fullData.sentiment_aggregate
        })
        // Select first document by default
        if (fullData.sentiment_trajectories.length > 0) {
          setSelectedDocId(fullData.sentiment_trajectories[0].doc_id)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load sentiment data:', err)
        setLoading(false)
      })
  }, [])

  // Get selected document
  const selectedDoc = useMemo(() => {
    if (!data || !selectedDocId) return null
    return data.sentiment_trajectories.find(d => d.doc_id === selectedDocId) || null
  }, [data, selectedDocId])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedDoc) return []

    return selectedDoc.data.map((point, i) => ({
      ...point,
      position: i + 1,
      smoothed_polarity: selectedDoc.smoothed.polarity[i - 2] ?? null,
      smoothed_severity: selectedDoc.smoothed.severity[i - 2] ?? null,
      smoothed_subjectivity: selectedDoc.smoothed.subjectivity[i - 2] ?? null,
    }))
  }, [selectedDoc])

  // Get color for current metric
  const metricColor = metric === 'polarity' ? COLORS.polarity :
                      metric === 'severity' ? COLORS.severity : COLORS.subjectivity

  if (loading) {
    return (
      <div className="space-y-4">
        <ChartSkeleton type="stat" height={60} />
        <ChartSkeleton type="line" height={300} />
      </div>
    )
  }

  if (!data || data.sentiment_trajectories.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500">No sentiment trajectory data available</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DocumentSelector
          documents={data.sentiment_trajectories}
          selectedId={selectedDocId}
          onSelect={setSelectedDocId}
        />

        <div className="flex items-center gap-4">
          <MetricToggle metric={metric} onChange={setMetric} />

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showSmoothed}
              onChange={(e) => setShowSmoothed(e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            Smoothed
          </label>
        </div>
      </div>

      {/* Trajectory Chart */}
      {selectedDoc && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: metricColor }} />
                  {metric.charAt(0).toUpperCase() + metric.slice(1)} Trajectory
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedDoc.drug_name} - {selectedDoc.sentence_count} sentences
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                selectedDoc.approval_status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedDoc.approval_status}
              </span>
            </div>
          </div>

          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorPolarity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.polarity} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.polarity} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.severity} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.severity} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSubjectivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.subjectivity} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.subjectivity} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis
                  dataKey="position"
                  tick={{ fill: COLORS.text, fontSize: 10 }}
                  label={{ value: 'Sentence Position', position: 'bottom', offset: -5, fontSize: 11, fill: COLORS.text }}
                />
                <YAxis
                  tick={{ fill: COLORS.text, fontSize: 10 }}
                  domain={metric === 'polarity' ? [-1, 1] : [0, 1]}
                />
                <Tooltip content={<CustomTooltip />} />

                {metric === 'polarity' && (
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                )}

                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={metricColor}
                  strokeWidth={1}
                  fillOpacity={0.3}
                  fill={`url(#color${metric.charAt(0).toUpperCase() + metric.slice(1)})`}
                  name={`Raw ${metric}`}
                  dot={false}
                />

                {showSmoothed && (
                  <Line
                    type="monotone"
                    dataKey={`smoothed_${metric}`}
                    stroke={metricColor}
                    strokeWidth={2.5}
                    dot={false}
                    name={`Smoothed ${metric}`}
                    connectNulls
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats for selected document */}
          <div className="p-4 pt-0 grid grid-cols-3 gap-3">
            <SummaryStat
              label="Mean Polarity"
              value={selectedDoc.summary.mean_polarity}
              trend={selectedDoc.summary.polarity_trend}
              color={COLORS.polarity}
            />
            <SummaryStat
              label="Mean Severity"
              value={selectedDoc.summary.mean_severity}
              color={COLORS.severity}
            />
            <SummaryStat
              label="Mean Subjectivity"
              value={selectedDoc.summary.mean_subjectivity}
              color={COLORS.subjectivity}
            />
          </div>
        </div>
      )}

      {/* Aggregate Comparison */}
      <div className="bg-gradient-to-r from-emerald-50 to-slate-50 rounded-xl p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Aggregate Sentiment Comparison</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-700">Approved CRLs</span>
              <span className="text-xs text-gray-500">({data.sentiment_aggregate.approved.count} docs)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Polarity: </span>
                <span className="font-mono font-semibold">{data.sentiment_aggregate.approved.mean_polarity.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-gray-500">Severity: </span>
                <span className="font-mono font-semibold">{data.sentiment_aggregate.approved.mean_severity.toFixed(3)}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="font-medium text-gray-700">Unapproved CRLs</span>
              <span className="text-xs text-gray-500">({data.sentiment_aggregate.unapproved.count} docs)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Polarity: </span>
                <span className="font-mono font-semibold">{data.sentiment_aggregate.unapproved.mean_polarity.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-gray-500">Severity: </span>
                <span className="font-mono font-semibold">{data.sentiment_aggregate.unapproved.mean_severity.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-2 text-sm text-blue-800">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Reading the trajectory:</strong> Polarity ranges from -1 (negative) to +1 (positive).
            Severity indicates harshness of FDA language (0-1). Subjectivity measures opinion vs fact (0-1).
            The smoothed line shows the overall trend through the document.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
