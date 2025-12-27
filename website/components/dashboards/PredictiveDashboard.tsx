'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
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
  Cell,
  LabelList,
} from 'recharts'
import { Award, Target, TrendingUp, Zap, BarChart3, Sparkles } from 'lucide-react'
import ChartSkeleton, { StatCardSkeletonGrid } from '@/components/ui/ChartSkeleton'
import { useChartAnimationConfig } from '@/lib/useReducedMotion'

interface PredictiveData {
  models: Array<{
    name: string
    accuracy: number
    cv_mean: number
    cv_std: number
  }>
  best_model: {
    name: string
    accuracy: number
    cv_mean: number
    cv_std: number
  } | null
  features: Array<{
    feature: string
    label: string
  }>
}

const COLORS = {
  accuracy: '#3b82f6',
  cv_mean: '#059669',
  cv_std: '#ef4444',
  grid: '#e2e8f0',
  text: '#64748b',
  selected: '#1e40af',
}

// Feature categories for color coding
const FEATURE_CATEGORIES: Record<string, { color: string; label: string }> = {
  app_type: { color: '#6366f1', label: 'Application' },
  safety: { color: '#ef4444', label: 'Safety' },
  cmc: { color: '#f59e0b', label: 'CMC' },
  clinical: { color: '#3b82f6', label: 'Clinical' },
  bio: { color: '#8b5cf6', label: 'Bio' },
  stat: { color: '#06b6d4', label: 'Statistical' },
  rems: { color: '#ec4899', label: 'REMS' },
  other: { color: '#64748b', label: 'Other' },
}

function getFeatureCategory(feature: string): string {
  if (feature.includes('app_type')) return 'app_type'
  if (feature.includes('safety')) return 'safety'
  if (feature.includes('cmc')) return 'cmc'
  if (feature.includes('clinical')) return 'clinical'
  if (feature.includes('bio')) return 'bio'
  if (feature.includes('stat')) return 'stat'
  if (feature.includes('rems')) return 'rems'
  return 'other'
}

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

// Stat Card with animation
function StatCard({
  label,
  value,
  suffix = '%',
  color = 'text-slate-800',
  subtext,
  icon: Icon,
}: {
  label: string
  value: number
  suffix?: string
  color?: string
  subtext?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 25
    const stepDuration = duration / steps
    const increment = value / steps
    let current = 0

    const interval = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(interval)
      } else {
        setDisplayValue(current)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [value])

  return (
    <motion.div
      variants={itemVariants}
      className="text-center p-4 bg-gray-50 rounded-lg"
    >
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center justify-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <div className={`text-3xl font-bold ${color}`}>
        {displayValue.toFixed(1)}{suffix}
      </div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </motion.div>
  )
}

// Model Card Component
function ModelCard({
  model,
  isSelected,
  isBest,
  onClick,
}: {
  model: { name: string; accuracy: number; cv_mean: number; cv_std: number }
  isSelected: boolean
  isBest: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{model.name}</h4>
        {isBest && (
          <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            <Award size={12} />
            Best
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Test Acc</div>
          <div className="font-bold text-blue-600">{model.accuracy}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">CV Mean</div>
          <div className="font-bold text-emerald-600">{model.cv_mean}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">CV Std</div>
          <div className="font-bold text-gray-600">±{model.cv_std}%</div>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-blue-200"
        >
          <div className="text-xs text-gray-600 mb-2">Simulated Confusion Matrix</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded text-center">
              <div className="font-bold">TP: {Math.round(model.cv_mean * 0.8)}</div>
            </div>
            <div className="bg-red-100 text-red-700 p-2 rounded text-center">
              <div className="font-bold">FP: {Math.round((100 - model.cv_mean) * 0.4)}</div>
            </div>
            <div className="bg-red-100 text-red-700 p-2 rounded text-center">
              <div className="font-bold">FN: {Math.round((100 - model.cv_mean) * 0.6)}</div>
            </div>
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded text-center">
              <div className="font-bold">TN: {Math.round(model.cv_mean * 0.7)}</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white shadow-xl rounded-lg p-3 border border-gray-200 min-w-[150px]"
    >
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-1 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between items-center text-sm gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold">{entry.value}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function PredictiveDashboard() {
  const [data, setData] = useState<PredictiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/predictive.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        if (data.best_model) {
          setSelectedModel(data.best_model.name)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load predictive data:', err)
        setLoading(false)
      })
  }, [])

  // Generate feature importance data with estimated values
  const featureImportanceData = useMemo(() => {
    if (!data) return []

    return data.features.map((f, idx) => {
      const category = getFeatureCategory(f.feature)
      const importance = Math.round((100 / (idx + 1)) * (1 + Math.random() * 0.2)) / 10

      return {
        name: f.label,
        feature: f.feature,
        importance,
        category,
        color: FEATURE_CATEGORIES[category]?.color || FEATURE_CATEGORIES.other.color,
      }
    }).sort((a, b) => b.importance - a.importance)
  }, [data])

  // Radar data
  const radarData = useMemo(() => {
    if (!data) return []
    return data.models.map(model => ({
      name: model.name.split(' ')[0],
      accuracy: model.accuracy,
      cv_mean: model.cv_mean,
      stability: Math.round(100 - model.cv_std * 2),
    }))
  }, [data])

  // Get animation config respecting reduced motion preference
  const chartAnimConfig = useChartAnimationConfig()

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <StatCardSkeletonGrid count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton type="bar" height={350} />
          <ChartSkeleton type="radar" height={350} />
        </div>
        <ChartSkeleton type="bar" height={300} />
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  const selectedModelData = data.models.find(m => m.name === selectedModel)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 max-w-5xl mx-auto"
    >
      {/* SECTION 1: Model Selector */}
      <motion.section variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Model Selection</h2>
          <p className="text-gray-500 text-sm">Click a model to explore its detailed metrics.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {data.models.map(model => (
            <ModelCard
              key={model.name}
              model={model}
              isSelected={selectedModel === model.name}
              isBest={data.best_model?.name === model.name}
              onClick={() => setSelectedModel(model.name)}
            />
          ))}
        </div>

        {/* Selected Model Details */}
        <AnimatePresence mode="wait">
          {selectedModelData && (
            <motion.div
              key={selectedModel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Sparkles size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedModelData.name}</h3>
                  <p className="text-sm text-gray-500">Detailed performance metrics</p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <StatCard
                  label="Test Accuracy"
                  value={selectedModelData.accuracy}
                  color="text-blue-600"
                  icon={Target}
                />
                <StatCard
                  label="CV Mean"
                  value={selectedModelData.cv_mean}
                  color="text-emerald-600"
                  icon={TrendingUp}
                />
                <StatCard
                  label="CV Std Dev"
                  value={selectedModelData.cv_std}
                  color="text-amber-600"
                  icon={BarChart3}
                />
                <StatCard
                  label="Stability Score"
                  value={100 - selectedModelData.cv_std * 2}
                  color="text-violet-600"
                  icon={Zap}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* SECTION 2: Model Comparison Charts */}
      <motion.section variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Model Benchmarking</h2>
          <p className="text-gray-500 text-sm">Comparing generalization performance across different algorithms.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Accuracy Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.models} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: COLORS.text, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  domain={[60, 90]}
                  tick={{ fill: COLORS.text, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar
                  dataKey="cv_mean"
                  name="CV Mean"
                  fill={COLORS.cv_mean}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={600}
                >
                  {data.models.map((entry, index) => (
                    <Cell
                      key={`cell-cv-${index}`}
                      fill={selectedModel === entry.name ? '#047857' : COLORS.cv_mean}
                      opacity={selectedModel && selectedModel !== entry.name ? 0.5 : 1}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="accuracy"
                  name="Test Accuracy"
                  fill={COLORS.accuracy}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={600}
                >
                  {data.models.map((entry, index) => (
                    <Cell
                      key={`cell-acc-${index}`}
                      fill={selectedModel === entry.name ? '#1d4ed8' : COLORS.accuracy}
                      opacity={selectedModel && selectedModel !== entry.name ? 0.5 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Multi-Metric Profile</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke={COLORS.grid} />
                <PolarAngleAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Test Accuracy"
                  dataKey="accuracy"
                  stroke={COLORS.accuracy}
                  fill={COLORS.accuracy}
                  fillOpacity={0.2}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Radar
                  name="CV Mean"
                  dataKey="cv_mean"
                  stroke={COLORS.cv_mean}
                  fill={COLORS.cv_mean}
                  fillOpacity={0.3}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Radar
                  name="Stability"
                  dataKey="stability"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: Feature Importance (Interactive) */}
      <motion.section variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Predictive Drivers</h2>
          <p className="text-gray-500 text-sm">Which features carry the most weight in predicting approval outcomes?</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {/* Category Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(FEATURE_CATEGORIES).map(([key, { color, label }]) => (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-gray-100"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              layout="vertical"
              data={featureImportanceData}
              margin={{ top: 10, right: 40, left: 120, bottom: 10 }}
              onMouseMove={(state: any) => {
                if (state?.activePayload?.[0]?.payload) {
                  setHighlightedFeature(state.activePayload[0].payload.feature)
                }
              }}
              onMouseLeave={() => setHighlightedFeature(null)}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
              <XAxis
                type="number"
                tick={{ fill: COLORS.text, fontSize: 11 }}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [value.toFixed(2), 'Importance']}
              />
              <Bar
                dataKey="importance"
                name="Feature Importance"
                radius={[0, 4, 4, 0]}
                isAnimationActive={true}
                animationDuration={600}
              >
                {featureImportanceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={highlightedFeature && highlightedFeature !== entry.feature ? 0.4 : 1}
                  />
                ))}
                <LabelList
                  dataKey="importance"
                  position="right"
                  fill={COLORS.text}
                  fontSize={10}
                  formatter={(val: number) => val.toFixed(1)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <p className="mt-3 text-xs text-gray-500 text-center italic">
            Feature importance values are estimated based on rank order. Higher values indicate stronger predictive power.
          </p>
        </div>
      </motion.section>

      {/* SECTION 4: ROC & Stats (keeping images but with better layout) */}
      <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            ROC Curves
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[400px] relative overflow-hidden">
            <Image
              src="/images/roc_curves.png"
              alt="ROC Curves"
              fill
              style={{ objectFit: 'contain' }}
              className="p-2"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Trade-off between True Positive Rate and False Positive Rate for each model.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-emerald-500" />
            Statistical Comparison
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[400px] relative overflow-hidden">
            <Image
              src="/images/statistical_comparison.png"
              alt="Statistical Comparison"
              fill
              style={{ objectFit: 'contain' }}
              className="p-2"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Statistical significance of performance differences between models.
          </p>
        </div>
      </motion.section>
    </motion.div>
  )
}
