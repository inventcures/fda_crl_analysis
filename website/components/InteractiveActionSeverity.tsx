'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

// Types
interface ActionItem {
  action_type: string
  label: string
  approved_mean: number
  unapproved_mean: number
  approved_total: number
  unapproved_total: number
  difference: number
}

interface SeverityBucket {
  range: string
  range_start: number
  range_end: number
  approved: number
  unapproved: number
}

interface ActionSeverityData {
  actions: ActionItem[]
  severity: {
    histogram: SeverityBucket[]
    approved_mean: number
    unapproved_mean: number
    approved_count: number
    unapproved_count: number
  }
  stats: {
    approved_documents: number
    unapproved_documents: number
  }
}

type ViewMode = 'radar' | 'bar'
type DataMode = 'mean' | 'total'

const COLORS = {
  approved: '#059669',
  unapproved: '#64748b',
  grid: '#e2e8f0',
  text: '#64748b',
}

// View toggle
function ViewToggle({
  view,
  onChange
}: {
  view: ViewMode
  onChange: (view: ViewMode) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange('radar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          view === 'radar'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Activity className="w-3.5 h-3.5" />
        Radar
      </button>
      <button
        onClick={() => onChange('bar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          view === 'bar'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Bar Chart
      </button>
    </div>
  )
}

// Data mode toggle
function DataModeToggle({
  mode,
  onChange
}: {
  mode: DataMode
  onChange: (mode: DataMode) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Show:</span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange('mean')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
            mode === 'mean'
              ? 'bg-slate-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Per Document
        </button>
        <button
          onClick={() => onChange('total')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
            mode === 'total'
              ? 'bg-slate-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Total Count
        </button>
      </div>
    </div>
  )
}

// Custom tooltip for radar
function RadarTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload

  return (
    <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-200 min-w-[160px]">
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-2 mb-2">
        {data?.label}
      </p>
      <div className="space-y-1.5 text-sm">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-mono font-semibold">{entry.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Custom tooltip for severity histogram
function SeverityTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-200 min-w-[140px]">
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-2 mb-2">
        Severity {label}
      </p>
      <div className="space-y-1.5 text-sm">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-mono font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Action details panel
function ActionDetailPanel({
  action,
  onClose
}: {
  action: ActionItem
  onClose: () => void
}) {
  const totalOccurrences = action.approved_total + action.unapproved_total
  const approvedPct = ((action.approved_total / totalOccurrences) * 100).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-lg text-gray-900">{action.label}</h4>
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
          <div className="text-xl font-bold text-emerald-700">{action.approved_total}</div>
          <div className="text-xs text-emerald-600">{approvedPct}%</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 uppercase font-semibold">Unapproved</div>
          <div className="text-xl font-bold text-gray-700">{action.unapproved_total}</div>
          <div className="text-xs text-gray-600">{(100 - parseFloat(approvedPct)).toFixed(1)}%</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 uppercase font-semibold">Per Doc (Appr)</div>
          <div className="text-xl font-bold text-blue-700">{action.approved_mean}</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center flex flex-col justify-center">
          {action.difference > 0.1 ? (
            <>
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto" />
              <div className="text-xs text-emerald-600 mt-1">More in Approved</div>
            </>
          ) : action.difference < -0.1 ? (
            <>
              <TrendingDown className="w-5 h-5 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-600 mt-1">More in Unapproved</div>
            </>
          ) : (
            <div className="text-xs text-gray-500">Similar rates</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Main component
export default function InteractiveActionSeverity() {
  const [data, setData] = useState<ActionSeverityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('radar')
  const [dataMode, setDataMode] = useState<DataMode>('mean')
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null)

  // Load data
  useEffect(() => {
    fetch('/data/action_severity_data.json')
      .then(res => res.json())
      .then((data: ActionSeverityData) => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load action/severity data:', err)
        setLoading(false)
      })
  }, [])

  // Prepare radar data
  const radarData = useMemo(() => {
    if (!data) return []

    return data.actions.map(action => ({
      ...action,
      approved: dataMode === 'mean' ? action.approved_mean : action.approved_total,
      unapproved: dataMode === 'mean' ? action.unapproved_mean : action.unapproved_total,
    }))
  }, [data, dataMode])

  // Calculate max value for radar
  const maxValue = useMemo(() => {
    if (!radarData.length) return 10
    const values = radarData.flatMap(d => [d.approved, d.unapproved])
    return Math.ceil(Math.max(...values) * 1.2)
  }, [radarData])

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <ChartSkeleton type="radar" height={350} />
        <ChartSkeleton type="bar" height={350} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500">Failed to load action/severity data</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Action Types Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">FDA Action Types</h3>
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">What FDA requests from sponsors</p>
            <DataModeToggle mode={dataMode} onChange={setDataMode} />
          </div>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'radar' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke={COLORS.grid} />
                    <PolarAngleAxis
                      dataKey="label"
                      tick={{ fill: COLORS.text, fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, maxValue]}
                      tick={{ fill: COLORS.text, fontSize: 9 }}
                    />
                    <Radar
                      name="Approved"
                      dataKey="approved"
                      stroke={COLORS.approved}
                      fill={COLORS.approved}
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Unapproved"
                      dataKey="unapproved"
                      stroke={COLORS.unapproved}
                      fill={COLORS.unapproved}
                      fillOpacity={0.3}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip content={<RadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={radarData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                    onClick={(e) => {
                      if (e?.activePayload?.[0]?.payload) {
                        const clicked = e.activePayload[0].payload as ActionItem
                        setSelectedAction(selectedAction?.action_type === clicked.action_type ? null : clicked)
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                    <XAxis
                      dataKey="label"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tick={{ fill: COLORS.text, fontSize: 10 }}
                      height={60}
                    />
                    <YAxis tick={{ fill: COLORS.text, fontSize: 10 }} />
                    <Tooltip content={<RadarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="approved"
                      name="Approved"
                      fill={COLORS.approved}
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {radarData.map((entry, index) => (
                        <Cell
                          key={`approved-${index}`}
                          fill={COLORS.approved}
                          opacity={selectedAction && selectedAction.action_type !== entry.action_type ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="unapproved"
                      name="Unapproved"
                      fill={COLORS.unapproved}
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {radarData.map((entry, index) => (
                        <Cell
                          key={`unapproved-${index}`}
                          fill={COLORS.unapproved}
                          opacity={selectedAction && selectedAction.action_type !== entry.action_type ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {selectedAction && (
              <ActionDetailPanel
                action={selectedAction}
                onClose={() => setSelectedAction(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Severity Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Severity Distribution</h3>
          <p className="text-xs text-gray-500">Distribution of severity scores across CRLs</p>
        </div>

        <div className="p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.severity.histogram}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="range"
                tick={{ fill: COLORS.text, fontSize: 9 }}
                interval={0}
              />
              <YAxis tick={{ fill: COLORS.text, fontSize: 10 }} />
              <Tooltip content={<SeverityTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="approved" name="Approved" fill={COLORS.approved} radius={[2, 2, 0, 0]} />
              <Bar dataKey="unapproved" name="Unapproved" fill={COLORS.unapproved} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-xs text-emerald-600 uppercase font-semibold">Approved Mean</div>
              <div className="text-2xl font-bold text-emerald-700">{data.severity.approved_mean.toFixed(3)}</div>
              <div className="text-xs text-emerald-600">{data.severity.approved_count} documents</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Unapproved Mean</div>
              <div className="text-2xl font-bold text-gray-700">{data.severity.unapproved_mean.toFixed(3)}</div>
              <div className="text-xs text-gray-600">{data.severity.unapproved_count} documents</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info box spanning both columns */}
      <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-2 text-sm text-blue-800">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Key Insight:</strong> Approved CRLs show higher facility action and labeling requests
            (indicating addressable issues), while both groups have similar major study requests.
            Severity scores are similar between groups, suggesting outcome depends more on issue type than language intensity.
          </div>
        </div>
      </div>
    </div>
  )
}
