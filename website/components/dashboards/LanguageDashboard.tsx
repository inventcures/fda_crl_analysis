'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
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
import { Brain, MessageSquare, TrendingUp, FileText } from 'lucide-react'

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
  approved: '#059669',  // Emerald-600
  unapproved: '#94a3b8',  // Slate-400
  grid: '#e2e8f0',
  text: '#64748b'
}

export default function LanguageDashboard() {
  const [data, setData] = useState<LanguageData | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  // Prepare comparison data
  const comparisonData = [
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

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* SECTION 1: Key Metrics */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Language Metrics</h2>
          <p className="text-gray-500 text-sm">Quantitative analysis of linguistic patterns in CRLs.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:border-blue-300 transition-colors">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              FDA Severity Score
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-xs text-green-700 uppercase tracking-wider mb-1 font-semibold">Approved</div>
                <div className="text-2xl font-bold text-green-800">
                  {data.severity.approved_mean.toFixed(3)}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Unapproved</div>
                <div className="text-2xl font-bold text-gray-600">
                  {data.severity.unapproved_mean.toFixed(3)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              <span className="font-semibold">Difference:</span> {data.severity.difference > 0 ? '+' : ''}{data.severity.difference.toFixed(3)}
              <br/>
              Higher score = harsher, more critical language.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:border-blue-300 transition-colors">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" />
              FDA Certainty Score
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-xs text-green-700 uppercase tracking-wider mb-1 font-semibold">Approved</div>
                <div className="text-2xl font-bold text-green-800">
                  {data.certainty.approved_mean.toFixed(3)}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Unapproved</div>
                <div className="text-2xl font-bold text-gray-600">
                  {data.certainty.unapproved_mean.toFixed(3)}
                </div>
              </div>
            </div>
             <p className="mt-4 text-sm text-gray-500">
              <span className="font-semibold">Difference:</span> {data.certainty.difference > 0 ? '+' : ''}{data.certainty.difference.toFixed(3)}
              <br/>
              Based on modal verbs (must, should, may).
            </p>
          </div>
        </div>

        {/* Metric Comparison Chart */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
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
              <Tooltip 
                 cursor={{ fill: '#f1f5f9' }}
                 contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="approved" name="Approved CRLs" fill={COLORS.approved} radius={[4, 4, 0, 0]} barSize={50} />
              <Bar dataKey="unapproved" name="Unapproved CRLs" fill={COLORS.unapproved} radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION 2: Word Clouds */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Term Frequency Analysis</h2>
          <p className="text-gray-500 text-sm">Visualizing common terms in approved vs. unapproved letters.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 text-center">Comparative Word Clouds</h3>
            <div className="relative w-full h-[400px]">
              <Image
                src="/images/language/wordcloud_comparison.png"
                alt="Word Cloud Comparison"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 text-center">Severity-Weighted Terms</h3>
            <div className="relative w-full h-[400px]">
              <Image
                src="/images/language/wordcloud_severity.png"
                alt="Severity Word Cloud"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: N-gram Analysis */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Phrase Patterns</h2>
          <p className="text-gray-500 text-sm">Identifying common 2-word (bigram) and 3-word (trigram) sequences.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 text-center">Top Bigrams</h3>
            <div className="relative w-full h-[400px]">
              <Image
                src="/images/language/bigram_comparison.png"
                alt="Bigram Comparison"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 text-center">Top Trigrams</h3>
            <div className="relative w-full h-[400px]">
              <Image
                src="/images/language/trigram_comparison.png"
                alt="Trigram Comparison"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Severity & Actions */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Severity Distribution</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[400px] relative shadow-sm">
            <Image
              src="/images/language/severity_distribution.png"
              alt="Severity Distribution"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Action Type Radar</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[400px] relative shadow-sm">
            <Image
              src="/images/language/action_radar.png"
              alt="Action Type Radar"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: Advanced Semantics */}
      <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain size={24} className="text-purple-600" />
            Latent Semantic Analysis
          </h2>
          <p className="text-gray-500 text-sm">Exploring hidden semantic structures using dimensionality reduction (t-SNE, UMAP) and clustering.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">t-SNE Embeddings</h4>
            <div className="relative w-full h-[350px]">
              <Image
                src="/images/language/tsne_embeddings.png"
                alt="t-SNE Embeddings"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">UMAP Embeddings</h4>
            <div className="relative w-full h-[350px]">
              <Image
                src="/images/language/umap_embeddings.png"
                alt="UMAP Embeddings"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">Cluster Analysis</h4>
            <div className="relative w-full h-[350px]">
              <Image
                src="/images/language/cluster_analysis.png"
                alt="Cluster Analysis"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">Severity Landscape</h4>
            <div className="relative w-full h-[350px]">
              <Image
                src="/images/language/severity_landscape.png"
                alt="Severity Landscape"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Topic & Sentiment */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Topic Modeling (LDA)</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[500px] relative shadow-sm">
            <Image
              src="/images/language/topic_model.png"
              alt="Topic Model"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Sentiment Trajectory</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-[500px] relative shadow-sm">
            <Image
              src="/images/language/sentiment_trajectory_sample.png"
              alt="Sentiment Trajectory"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
