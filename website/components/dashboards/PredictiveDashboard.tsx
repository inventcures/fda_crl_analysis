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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Award, Target, TrendingUp, Zap } from 'lucide-react'

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
  accuracy: '#3B82F6', // Blue-500
  cv_mean: '#10B981', // Emerald-500
  cv_std: '#EF4444', // Red-500
}

export default function PredictiveDashboard() {
  const [data, setData] = useState<PredictiveData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/predictive.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load predictive data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!data) {
    return <div className="text-center py-12 text-red-600">Failed to load data</div>
  }

  // Prepare radar data for model comparison
  const radarData = data.models.map(model => ({
    name: model.name.split(' ')[0], // Shorten name for radar
    accuracy: model.accuracy,
    cv_mean: model.cv_mean,
    stability: 100 - model.cv_std, // Convert std to stability score
  }))

  return (
    <div className="space-y-8">
      {/* Best Model Highlight */}
      {data.best_model && (
        <div className="bg-white border border-border-light rounded-sm shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-accent/10 p-3 rounded-full">
              <Award size={32} className="text-accent" />
            </div>
            <h3 className="text-2xl font-mono font-bold text-text-primary">Best Performing Model</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">Model</div>
              <div className="text-3xl font-mono font-bold text-text-primary">{data.best_model.name}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">Cross-Validation Accuracy</div>
              <div className="text-4xl font-mono font-bold text-success">{data.best_model.cv_mean}%</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-2">Test Set Accuracy</div>
              <div className="text-4xl font-mono font-bold text-accent">{data.best_model.accuracy}%</div>
            </div>
          </div>
          <div className="mt-6 bg-subtle rounded-sm p-4 border border-border-light">
            <p className="text-sm text-text-secondary font-light">
              This model achieved the highest cross-validation accuracy in predicting whether a drug
              that received a CRL will eventually be approved. ±{data.best_model.cv_std}% standard deviation.
            </p>
          </div>
        </div>
      )}

      {/* Model Comparison */}
      <div className="bg-white border border-border-light p-8">
        <div className="flex items-center gap-3 mb-6">
          <Target className="text-accent" size={24} />
          <h3 className="text-xl font-mono text-text-primary">Model Performance Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.models}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { fontFamily: 'var(--font-ubuntu-mono)', fill: '#64748B' } }}
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                fontFamily: 'var(--font-ubuntu-mono)',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'var(--font-ubuntu-mono)', fontSize: '12px', paddingTop: '20px' }} />
            <Bar dataKey="accuracy" fill={COLORS.accuracy} name="Test Accuracy %" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cv_mean" fill={COLORS.cv_mean} name="CV Mean %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 text-sm text-text-secondary font-mono bg-subtle p-4 rounded-sm">
          <p className="font-bold mb-2 text-text-primary">INTERPRETATION:</p>
          <ul className="list-none space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              All models significantly outperform random baseline (~50%)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              Ensemble methods (Random Forest, Gradient Boosting) show strong generalization
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              Cross-validation scores are more reliable than single test set results
            </li>
          </ul>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-6">Multi-Metric Model Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} />
            <Radar
              name="Test Accuracy"
              dataKey="accuracy"
              stroke={COLORS.accuracy}
              fill={COLORS.accuracy}
              fillOpacity={0.2}
            />
            <Radar
              name="CV Accuracy"
              dataKey="cv_mean"
              stroke={COLORS.cv_mean}
              fill={COLORS.cv_mean}
              fillOpacity={0.2}
            />
            <Radar
              name="Stability"
              dataKey="stability"
              stroke={COLORS.cv_std}
              fill={COLORS.cv_std}
              fillOpacity={0.2}
            />
            <Legend wrapperStyle={{ fontFamily: 'var(--font-ubuntu-mono)', fontSize: '12px', paddingTop: '20px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                fontFamily: 'var(--font-ubuntu-mono)',
                fontSize: '12px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
        <p className="mt-6 text-sm text-text-secondary font-mono text-center">
          Stability = 100 - CV Standard Deviation. Higher is better for all metrics.
        </p>
      </div>

      {/* Feature Importance */}
      <div className="bg-white border border-border-light p-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-accent" size={24} />
          <h3 className="text-xl font-mono text-text-primary">Top Predictive Features</h3>
        </div>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Features used by the machine learning models to predict approval outcomes
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.features.map((feature, idx) => (
            <div
              key={feature.feature}
              className="bg-subtle border border-border-light rounded-sm p-4 flex items-center gap-3 transition-colors hover:border-accent"
            >
              <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-mono font-bold text-sm">
                {idx + 1}
              </div>
              <div className="text-sm font-medium text-text-primary font-mono">{feature.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-accent-light border-l-4 border-accent p-5 rounded-sm">
          <p className="text-sm text-text-primary">
            <span className="font-bold font-mono uppercase tracking-wider block mb-2">Key Insights:</span>
            The most important predictors include application type (NDA vs BLA vs ANDA), whether a new clinical trial is required,
            and the presence of specific deficiency types (safety, CMC, bioequivalence).
          </p>
        </div>
      </div>

      {/* Feature Importance Image */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-4">Feature Importance (Random Forest)</h3>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Relative importance of features in the best-performing Random Forest model
        </p>
        <div className="relative w-full bg-subtle rounded-sm p-4" style={{ height: '500px' }}>
          <Image
            src="/images/feature_importance.png"
            alt="Feature Importance"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* ROC Curves */}
      <div className="bg-white border border-border-light p-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-accent" size={24} />
          <h3 className="text-xl font-mono text-text-primary">ROC Curves</h3>
        </div>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Receiver Operating Characteristic curves showing the trade-off between
          true positive rate and false positive rate for each model
        </p>
        <div className="relative w-full bg-subtle rounded-sm p-4" style={{ height: '500px' }}>
          <Image
            src="/images/roc_curves.png"
            alt="ROC Curves"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="mt-6 text-sm text-text-secondary font-mono bg-subtle p-4 rounded-sm">
          <p className="font-bold mb-2 text-text-primary">UNDERSTANDING ROC CURVES:</p>
          <ul className="list-none space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              AUC (Area Under Curve) closer to 1.0 indicates better classification performance
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              All models perform significantly better than random (diagonal line, AUC = 0.5)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              Curves closer to top-left corner indicate better true/false positive trade-offs
            </li>
          </ul>
        </div>
      </div>

      {/* Statistical Comparison */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-4">Statistical Feature Comparison</h3>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Statistical significance of feature differences between approved and unapproved CRLs
        </p>
        <div className="relative w-full bg-subtle rounded-sm p-4" style={{ height: '600px' }}>
          <Image
            src="/images/statistical_comparison.png"
            alt="Statistical Comparison"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-subtle border border-border-light rounded-sm p-6">
        <h4 className="font-mono font-bold mb-3 text-text-primary">Methodology Notes</h4>
        <ul className="space-y-2 text-sm text-text-secondary font-mono">
          <li>• <span className="font-bold text-text-primary">Training:</span> Models trained on ~240 CRLs with 5-fold cross-validation</li>
          <li>• <span className="font-bold text-text-primary">Test Set:</span> ~60 held-out CRLs for final evaluation</li>
          <li>• <span className="font-bold text-text-primary">Features:</span> Deficiency categories, application type, document metadata, language patterns</li>
          <li>• <span className="font-bold text-text-primary">Baseline:</span> Random guessing achieves ~68% accuracy (due to class imbalance toward approved)</li>
          <li>• <span className="font-bold text-text-primary">Caveat:</span> Small dataset limits model generalization; interpret with caution</li>
        </ul>
      </div>
    </div>
  )
}
