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
} from 'recharts'
import { Brain, MessageSquare, TrendingUp, ChevronDown, ZoomIn, X, Layers, PieChart } from 'lucide-react'

interface LanguageData {
  severity: {
    approved_mean: number
    unapproved_mean: number
    difference: number
  }
  certainty: {
    approved_mean: number
    unapproved_mean: number
    difference: number
  }
  visualizations: string[]
}

const COLORS = {
  approved: '#059669',
  unapproved: '#94a3b8',
  grid: '#e2e8f0',
  text: '#64748b',
  positive: '#10b981',
  negative: '#ef4444',
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

// Animated Stat with count-up
function AnimatedStat({
  value,
  decimals = 3,
  label,
  color = 'text-gray-800',
  bgColor = 'bg-gray-50',
  delay = 0
}: {
  value: number
  decimals?: number
  label: string
  color?: string
  bgColor?: string
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
          setDisplayValue(current)
        }
      }, stepDuration)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <div className={`${bgColor} p-4 rounded-lg`}>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>
        {displayValue.toFixed(decimals)}
      </div>
    </div>
  )
}

// Expandable Metric Card
function MetricCard({
  title,
  icon: Icon,
  iconColor,
  approvedMean,
  unapprovedMean,
  difference,
  description,
  explanation
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  approvedMean: number
  unapprovedMean: number
  difference: number
  description: string
  explanation: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
    >
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {title}
          </h3>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} className="text-gray-400" />
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AnimatedStat
            value={approvedMean}
            label="Approved"
            color="text-emerald-700"
            bgColor="bg-emerald-50"
          />
          <AnimatedStat
            value={unapprovedMean}
            label="Unapproved"
            color="text-gray-600"
            bgColor="bg-gray-100"
            delay={150}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">{description}</span>
          <span className={`font-semibold font-mono ${difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-amber-600' : 'text-gray-500'}`}>
            {difference > 0 ? '+' : ''}{difference.toFixed(3)}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-blue-50 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Brain size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p>{explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Image Gallery with Zoom Modal
function ImageCard({
  src,
  alt,
  title,
  onZoom
}: {
  src: string
  alt: string
  title: string
  onZoom: (src: string, title: string) => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer group"
      onClick={() => onZoom(src, title)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
        <ZoomIn size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="relative w-full h-[350px] bg-gray-50 rounded">
        <Image
          src={src}
          alt={alt}
          fill
          style={{ objectFit: 'contain' }}
          className="p-2"
        />
      </div>
    </motion.div>
  )
}

// Zoom Modal
function ZoomModal({
  src,
  title,
  onClose
}: {
  src: string
  title: string
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="relative w-full" style={{ height: 'calc(90vh - 60px)' }}>
          <Image
            src={src}
            alt={title}
            fill
            style={{ objectFit: 'contain' }}
            className="p-4"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

// Tab Component for N-gram Analysis
function NgramTabs({
  onZoom
}: {
  onZoom: (src: string, title: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'bigrams' | 'trigrams'>('bigrams')

  return (
    <motion.section variants={itemVariants}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Phrase Patterns</h2>
          <p className="text-gray-500 text-sm">Identifying common multi-word sequences.</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('bigrams')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'bigrams'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bigrams (2-word)
          </button>
          <button
            onClick={() => setActiveTab('trigrams')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'trigrams'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Trigrams (3-word)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'bigrams' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'bigrams' ? 10 : -10 }}
          transition={{ duration: 0.2 }}
        >
          <ImageCard
            src={`/images/language/${activeTab === 'bigrams' ? 'bigram' : 'trigram'}_comparison.png`}
            alt={`${activeTab} Comparison`}
            title={activeTab === 'bigrams' ? 'Top Bigrams by Outcome' : 'Top Trigrams by Outcome'}
            onZoom={onZoom}
          />
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-200 min-w-[140px]">
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-1 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex justify-between items-center text-sm gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-mono font-semibold">{entry.value.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LanguageDashboard() {
  const [data, setData] = useState<LanguageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards')

  useEffect(() => {
    fetch('/data/language.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load language data:', err)
        setLoading(false)
      })
  }, [])

  const handleZoom = (src: string, title: string) => {
    setZoomedImage({ src, title })
  }

  // Comparison data for chart
  const comparisonData = useMemo(() => {
    if (!data) return []
    return [
      {
        metric: 'Severity',
        approved: data.severity.approved_mean,
        unapproved: data.severity.unapproved_mean,
      },
      {
        metric: 'Certainty',
        approved: data.certainty.approved_mean,
        unapproved: data.certainty.unapproved_mean,
      },
    ]
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12 max-w-5xl mx-auto"
      >
        {/* SECTION 1: Key Metrics */}
        <motion.section variants={itemVariants}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Language Metrics</h2>
              <p className="text-gray-500 text-sm">Quantitative analysis of linguistic patterns in CRLs.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'chart'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                Chart
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'cards' ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 gap-6"
              >
                <MetricCard
                  title="FDA Severity Score"
                  icon={TrendingUp}
                  iconColor="text-blue-500"
                  approvedMean={data.severity.approved_mean}
                  unapprovedMean={data.severity.unapproved_mean}
                  difference={data.severity.difference}
                  description="Higher = harsher language"
                  explanation="The severity score measures the intensity of critical language in CRLs. Surprisingly, approved CRLs show slightly higher severity, suggesting that clear, specific criticism may actually help sponsors address issues effectively."
                />
                <MetricCard
                  title="FDA Certainty Score"
                  icon={MessageSquare}
                  iconColor="text-purple-500"
                  approvedMean={data.certainty.approved_mean}
                  unapprovedMean={data.certainty.unapproved_mean}
                  difference={data.certainty.difference}
                  description="Based on modal verbs"
                  explanation="The certainty score is derived from modal verb usage (must vs. should vs. may). Higher certainty in approved CRLs indicates FDA was more definitive about requirements, giving sponsors clearer guidance."
                />
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                    <XAxis
                      dataKey="metric"
                      tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: COLORS.text, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="approved"
                      name="Approved CRLs"
                      fill={COLORS.approved}
                      radius={[4, 4, 0, 0]}
                      barSize={60}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Bar
                      dataKey="unapproved"
                      name="Unapproved CRLs"
                      fill={COLORS.unapproved}
                      radius={[4, 4, 0, 0]}
                      barSize={60}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* SECTION 2: Word Clouds */}
        <motion.section variants={itemVariants}>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Term Frequency Analysis</h2>
            <p className="text-gray-500 text-sm">Visualizing common terms in approved vs. unapproved letters. Click to zoom.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ImageCard
              src="/images/language/wordcloud_comparison.png"
              alt="Word Cloud Comparison"
              title="Comparative Word Clouds"
              onZoom={handleZoom}
            />
            <ImageCard
              src="/images/language/wordcloud_severity.png"
              alt="Severity Word Cloud"
              title="Severity-Weighted Terms"
              onZoom={handleZoom}
            />
          </div>
        </motion.section>

        {/* SECTION 3: N-gram Analysis (Tabbed) */}
        <NgramTabs onZoom={handleZoom} />

        {/* SECTION 4: Severity & Actions */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-6">
          <ImageCard
            src="/images/language/severity_distribution.png"
            alt="Severity Distribution"
            title="Severity Distribution"
            onZoom={handleZoom}
          />
          <ImageCard
            src="/images/language/action_radar.png"
            alt="Action Type Radar"
            title="Action Type Radar"
            onZoom={handleZoom}
          />
        </motion.section>

        {/* SECTION 5: Advanced Semantics */}
        <motion.section variants={itemVariants} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain size={24} className="text-purple-600" />
              Latent Semantic Analysis
            </h2>
            <p className="text-gray-600 text-sm">Exploring hidden semantic structures using dimensionality reduction and clustering. Click any visualization to zoom.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ImageCard
              src="/images/language/tsne_embeddings.png"
              alt="t-SNE Embeddings"
              title="t-SNE Embeddings"
              onZoom={handleZoom}
            />
            <ImageCard
              src="/images/language/umap_embeddings.png"
              alt="UMAP Embeddings"
              title="UMAP Embeddings"
              onZoom={handleZoom}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ImageCard
              src="/images/language/cluster_analysis.png"
              alt="Cluster Analysis"
              title="Cluster Analysis"
              onZoom={handleZoom}
            />
            <ImageCard
              src="/images/language/severity_landscape.png"
              alt="Severity Landscape"
              title="Severity Landscape"
              onZoom={handleZoom}
            />
          </div>
        </motion.section>

        {/* SECTION 6: Topic & Sentiment */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Layers size={18} className="text-indigo-500" />
              Topic Modeling (LDA)
            </h3>
            <ImageCard
              src="/images/language/topic_model.png"
              alt="Topic Model"
              title="Latent Topics"
              onZoom={handleZoom}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-amber-500" />
              Sentiment Trajectory
            </h3>
            <ImageCard
              src="/images/language/sentiment_trajectory_sample.png"
              alt="Sentiment Trajectory"
              title="Document Sentiment Flow"
              onZoom={handleZoom}
            />
          </div>
        </motion.section>
      </motion.div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <ZoomModal
            src={zoomedImage.src}
            title={zoomedImage.title}
            onClose={() => setZoomedImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
