'use client'

import { useEffect, useState, useMemo } from 'react'
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
  Layers,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

// Types
interface TopicWord {
  word: string
  weight: number
}

interface Topic {
  id: number
  label: string
  words: TopicWord[]
}

interface TopicDifference {
  topic_id: number
  label: string
  approved_weight: number
  unapproved_weight: number
  difference: number
  top_words: string[]
}

interface TopicModelData {
  topics: Topic[]
  document_topics: {
    approved: number[]
    unapproved: number[]
  }
  topic_differences: TopicDifference[]
  stats: {
    n_documents: number
    n_approved: number
    n_unapproved: number
    n_topics: number
  }
}

const COLORS = {
  approved: '#059669',
  unapproved: '#64748b',
  highlight: '#3b82f6',
  grid: '#e2e8f0',
  text: '#64748b',
}

// Topic word cloud-like display
function TopicWords({
  words,
  maxWeight,
  color
}: {
  words: TopicWord[]
  maxWeight: number
  color: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((word, i) => {
        const normalizedWeight = word.weight / maxWeight
        const fontSize = 10 + normalizedWeight * 8
        const opacity = 0.4 + normalizedWeight * 0.6

        return (
          <motion.span
            key={word.word}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="px-2 py-0.5 rounded-full"
            style={{
              fontSize: `${fontSize}px`,
              backgroundColor: `${color}${Math.round(opacity * 40).toString(16).padStart(2, '0')}`,
              color: color,
              fontWeight: normalizedWeight > 0.5 ? 600 : 400,
            }}
          >
            {word.word}
          </motion.span>
        )
      })}
    </div>
  )
}

// Topic card component
function TopicCard({
  topic,
  difference,
  isSelected,
  onClick,
  maxWeight
}: {
  topic: Topic
  difference: TopicDifference
  isSelected: boolean
  onClick: () => void
  maxWeight: number
}) {
  const diffColor = difference.difference > 0.01 ? COLORS.approved :
                    difference.difference < -0.01 ? COLORS.unapproved : '#94a3b8'

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          {topic.label}
        </h4>
        <div className="flex items-center gap-1">
          {difference.difference > 0.01 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : difference.difference < -0.01 ? (
            <TrendingDown className="w-4 h-4 text-slate-500" />
          ) : null}
          <span className="text-xs font-mono" style={{ color: diffColor }}>
            {difference.difference > 0 ? '+' : ''}{(difference.difference * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <TopicWords words={topic.words} maxWeight={maxWeight} color="#6366f1" />

      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Approved: </span>
          <span className="font-semibold text-emerald-600">
            {(difference.approved_weight * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Unapproved: </span>
          <span className="font-semibold text-gray-600">
            {(difference.unapproved_weight * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload

  return (
    <div className="bg-white shadow-xl rounded-lg p-3 border border-gray-200 min-w-[160px]">
      <p className="font-semibold text-sm text-slate-800 border-b border-gray-100 pb-2 mb-2">
        {data?.label}
      </p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Approved
          </span>
          <span className="font-mono font-semibold">
            {(data?.approved_weight * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Unapproved
          </span>
          <span className="font-mono font-semibold">
            {(data?.unapproved_weight * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
        Top words: {data?.top_words?.slice(0, 3).join(', ')}
      </div>
    </div>
  )
}

// Main component
export default function InteractiveTopicModel() {
  const [data, setData] = useState<TopicModelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null)

  // Load data
  useEffect(() => {
    fetch('/data/topic_sentiment_data.json')
      .then(res => res.json())
      .then((fullData) => {
        setData(fullData.topic_model)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load topic model data:', err)
        setLoading(false)
      })
  }, [])

  // Find max weight for normalization
  const maxWeight = useMemo(() => {
    if (!data) return 1
    return Math.max(...data.topics.flatMap(t => t.words.map(w => w.weight)))
  }, [data])

  // Chart data
  const chartData = useMemo(() => {
    if (!data) return []
    return data.topic_differences.map(diff => ({
      ...diff,
      approved: diff.approved_weight * 100,
      unapproved: diff.unapproved_weight * 100,
    }))
  }, [data])

  if (loading) {
    return (
      <div className="space-y-4">
        <ChartSkeleton type="bar" height={200} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <ChartSkeleton key={i} type="stat" height={120} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500">Failed to load topic model data</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Topic Distribution Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Topic Distribution by Outcome</h3>
          <p className="text-xs text-gray-500">
            How each topic is weighted in approved vs unapproved CRLs. Click bars to explore topics.
          </p>
        </div>

        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={(e) => {
                if (e?.activePayload?.[0]?.payload) {
                  const clicked = e.activePayload[0].payload
                  setSelectedTopic(selectedTopic === clicked.topic_id ? null : clicked.topic_id)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: COLORS.text, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: COLORS.text, fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar
                dataKey="approved"
                name="Approved"
                fill={COLORS.approved}
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`approved-${index}`}
                    fill={COLORS.approved}
                    opacity={selectedTopic !== null && selectedTopic !== entry.topic_id ? 0.3 : 1}
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
                {chartData.map((entry, index) => (
                  <Cell
                    key={`unapproved-${index}`}
                    fill={COLORS.unapproved}
                    opacity={selectedTopic !== null && selectedTopic !== entry.topic_id ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.topics.map((topic) => {
          const difference = data.topic_differences.find(d => d.topic_id === topic.id)!
          return (
            <TopicCard
              key={topic.id}
              topic={topic}
              difference={difference}
              isSelected={selectedTopic === topic.id}
              onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
              maxWeight={maxWeight}
            />
          )
        })}
      </div>

      {/* Selected topic detail */}
      <AnimatePresence>
        {selectedTopic !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">
                {data.topics[selectedTopic].label} - Word Weights
              </h4>
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {data.topics[selectedTopic].words.map((word, i) => (
                <div
                  key={word.word}
                  className="bg-white/80 rounded-lg p-2 text-center"
                >
                  <div className="font-semibold text-indigo-700">{word.word}</div>
                  <div className="text-xs text-gray-500">{word.weight.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase">Topics</div>
          <div className="text-xl font-bold text-indigo-600">{data.stats.n_topics}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase">Documents</div>
          <div className="text-xl font-bold text-gray-700">{data.stats.n_documents}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase">Approved</div>
          <div className="text-xl font-bold text-emerald-600">{data.stats.n_approved}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase">Unapproved</div>
          <div className="text-xl font-bold text-slate-600">{data.stats.n_unapproved}</div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-2 text-sm text-blue-800">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>About LDA Topics:</strong> Latent Dirichlet Allocation identifies hidden topics
            in documents. Each topic is characterized by frequently co-occurring words. The percentages
            show how strongly each topic appears in approved vs unapproved CRLs on average.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
