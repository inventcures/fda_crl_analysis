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
  approved: '#059669',  // Muted green (academic palette)
  unapproved: '#DC2626',  // Muted red (academic palette)
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!data) {
    return <div className="text-center py-12 text-red-600">Failed to load data</div>
  }

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
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border-light p-8 hover:border-accent transition-colors">
          <h3 className="text-xl font-semibold text-text-primary mb-4">FDA Severity Score</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-text-secondary mb-1">Approved CRLs</div>
              <div className="text-2xl font-bold text-success">
                {data.severity.approved_mean.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-secondary mb-1">Unapproved CRLs</div>
              <div className="text-2xl font-bold text-error">
                {data.severity.unapproved_mean.toFixed(3)}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Difference:</span>{' '}
              {data.severity.difference > 0 ? '+' : ''}
              {data.severity.difference.toFixed(3)}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Higher severity indicates harsher FDA language
            </p>
          </div>
        </div>

        <div className="bg-white border border-border-light p-8 hover:border-accent transition-colors">
          <h3 className="text-xl font-semibold text-text-primary mb-4">FDA Certainty Score</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-text-secondary mb-1">Approved CRLs</div>
              <div className="text-2xl font-bold text-success">
                {data.certainty.approved_mean.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-secondary mb-1">Unapproved CRLs</div>
              <div className="text-2xl font-bold text-error">
                {data.certainty.unapproved_mean.toFixed(3)}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-sm text-text-secondary">
              <span className="font-medium">Difference:</span>{' '}
              {data.certainty.difference > 0 ? '+' : ''}
              {data.certainty.difference.toFixed(3)}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Based on modal verbs (must, should, may, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Language Metrics Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" fill={COLORS.approved} name="Approved CRLs" />
            <Bar dataKey="unapproved" fill={COLORS.unapproved} name="Unapproved CRLs" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Word Clouds */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Comparative Word Clouds</h3>
          <p className="text-sm text-text-secondary mb-4">
            Most frequent terms in approved vs. unapproved CRLs
          </p>
          <div className="relative w-full" style={{ height: '400px' }}>
            <Image
              src="/images/language/wordcloud_comparison.png"
              alt="Word Cloud Comparison"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Severity-Weighted Word Cloud</h3>
          <p className="text-sm text-text-secondary mb-4">
            Terms colored by FDA severity score
          </p>
          <div className="relative w-full" style={{ height: '400px' }}>
            <Image
              src="/images/language/wordcloud_severity.png"
              alt="Severity Word Cloud"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>

      {/* N-gram Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Top Bigrams by Outcome</h3>
          <p className="text-sm text-text-secondary mb-4">
            Most common 2-word phrases in each group
          </p>
          <div className="relative w-full" style={{ height: '400px' }}>
            <Image
              src="/images/language/bigram_comparison.png"
              alt="Bigram Comparison"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Top Trigrams by Outcome</h3>
          <p className="text-sm text-text-secondary mb-4">
            Most common 3-word phrases in each group
          </p>
          <div className="relative w-full" style={{ height: '400px' }}>
            <Image
              src="/images/language/trigram_comparison.png"
              alt="Trigram Comparison"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>

      {/* Severity & Action Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Severity Distribution</h3>
          <p className="text-sm text-text-secondary mb-4">
            Distribution of severity scores across approved vs. unapproved CRLs
          </p>
          <div className="relative w-full" style={{ height: '400px' }}>
            <Image
              src="/images/language/severity_distribution.png"
              alt="Severity Distribution"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">FDA Action Type Radar</h3>
          <p className="text-sm text-text-secondary mb-4">
            Types of actions requested by FDA in approved vs. unapproved CRLs
          </p>
          <div className="relative w-full" style={{ height: '400px' }}>
            <Image
              src="/images/language/action_radar.png"
              alt="Action Type Radar"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>

      {/* Latent Space Visualizations */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Semantic Embeddings & Clustering</h3>
        <p className="text-sm text-text-secondary mb-6">
          Dimensionality reduction techniques (t-SNE, UMAP) to visualize CRL documents in latent space,
          revealing semantic patterns and clusters.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-text-primary mb-3">t-SNE Embeddings</h4>
            <div className="relative w-full" style={{ height: '400px' }}>
              <Image
                src="/images/language/tsne_embeddings.png"
                alt="t-SNE Embeddings"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-3">UMAP Embeddings</h4>
            <div className="relative w-full" style={{ height: '400px' }}>
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
          <div>
            <h4 className="font-semibold text-text-primary mb-3">K-Means Cluster Analysis</h4>
            <div className="relative w-full" style={{ height: '400px' }}>
              <Image
                src="/images/language/cluster_analysis.png"
                alt="Cluster Analysis"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-3">Severity Landscape</h4>
            <div className="relative w-full" style={{ height: '400px' }}>
              <Image
                src="/images/language/severity_landscape.png"
                alt="Severity Landscape"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Topic Modeling */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Topic Modeling (LDA)</h3>
        <p className="text-sm text-text-secondary mb-4">
          Latent Dirichlet Allocation reveals underlying topics in CRL documents
        </p>
        <div className="relative w-full" style={{ height: '600px' }}>
          <Image
            src="/images/language/topic_model.png"
            alt="Topic Model"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Sample Sentiment Trajectory */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Sentiment Trajectory (Sample Document)</h3>
        <p className="text-sm text-text-secondary mb-4">
          How FDA sentiment evolves through a sample CRL document
        </p>
        <div className="relative w-full" style={{ height: '500px' }}>
          <Image
            src="/images/language/sentiment_trajectory_sample.png"
            alt="Sentiment Trajectory"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}
