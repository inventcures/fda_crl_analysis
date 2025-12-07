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
  accuracy: '#005ea2',
  cv_mean: '#00a91c',
  cv_std: '#e52207',
}

export default function PredictiveDashboard() {
  const [data, setData] = useState<PredictiveData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/predictive.json')
      .then(res => res.json())
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
        <div className="bg-gradient-to-br from-fda-blue to-fda-darkblue text-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <Award size={32} />
            <h3 className="text-2xl font-bold">Best Performing Model</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-blue-200 text-sm mb-1">Model</div>
              <div className="text-2xl font-bold">{data.best_model.name}</div>
            </div>
            <div>
              <div className="text-blue-200 text-sm mb-1">Cross-Validation Accuracy</div>
              <div className="text-3xl font-bold">{data.best_model.cv_mean}%</div>
            </div>
            <div>
              <div className="text-blue-200 text-sm mb-1">Test Set Accuracy</div>
              <div className="text-3xl font-bold">{data.best_model.accuracy}%</div>
            </div>
          </div>
          <div className="mt-4 bg-white/10 rounded p-3">
            <p className="text-sm text-blue-100">
              This model achieved the highest cross-validation accuracy in predicting whether a drug
              that received a CRL will eventually be approved. ±{data.best_model.cv_std}% standard deviation.
            </p>
          </div>
        </div>
      )}

      {/* Model Comparison */}
      <div className="bg-white border border-border-light p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-accent" size={24} />
          <h3 className="text-xl font-semibold">Model Performance Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.models}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="accuracy" fill={COLORS.accuracy} name="Test Accuracy %" />
            <Bar dataKey="cv_mean" fill={COLORS.cv_mean} name="CV Mean %" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-text-secondary">
          <p className="font-medium mb-2">Interpretation:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All models significantly outperform random baseline (~50%)</li>
            <li>Ensemble methods (Random Forest, Gradient Boosting) show strong generalization</li>
            <li>Cross-validation scores are more reliable than single test set results</li>
          </ul>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Multi-Metric Model Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Test Accuracy"
              dataKey="accuracy"
              stroke="#005ea2"
              fill="#005ea2"
              fillOpacity={0.3}
            />
            <Radar
              name="CV Accuracy"
              dataKey="cv_mean"
              stroke="#00a91c"
              fill="#00a91c"
              fillOpacity={0.3}
            />
            <Radar
              name="Stability"
              dataKey="stability"
              stroke="#ff9800"
              fill="#ff9800"
              fillOpacity={0.3}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
        <p className="mt-4 text-sm text-text-secondary">
          Stability = 100 - CV Standard Deviation. Higher is better for all metrics.
        </p>
      </div>

      {/* Feature Importance */}
      <div className="bg-white border border-border-light p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-orange-500" size={24} />
          <h3 className="text-xl font-semibold">Top Predictive Features</h3>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Features used by the machine learning models to predict approval outcomes
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.features.map((feature, idx) => (
            <div
              key={feature.feature}
              className="bg-gray-50 border border-gray-200 rounded p-3 flex items-center gap-3"
            >
              <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <div className="text-sm font-medium text-gray-700">{feature.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-blue-50 border-l-4 border-accent p-4 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Key Insights:</span> The most important predictors include
            application type (NDA vs BLA vs ANDA), whether a new clinical trial is required,
            and the presence of specific deficiency types (safety, CMC, bioequivalence).
          </p>
        </div>
      </div>

      {/* Feature Importance Image */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Feature Importance (Random Forest)</h3>
        <p className="text-sm text-text-secondary mb-4">
          Relative importance of features in the best-performing Random Forest model
        </p>
        <div className="relative w-full" style={{ height: '500px' }}>
          <Image
            src="/images/feature_importance.png"
            alt="Feature Importance"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* ROC Curves */}
      <div className="bg-white border border-border-light p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-purple-600" size={24} />
          <h3 className="text-xl font-semibold">ROC Curves</h3>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Receiver Operating Characteristic curves showing the trade-off between
          true positive rate and false positive rate for each model
        </p>
        <div className="relative w-full" style={{ height: '500px' }}>
          <Image
            src="/images/roc_curves.png"
            alt="ROC Curves"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="mt-4 text-sm text-text-secondary">
          <p className="font-medium mb-2">Understanding ROC Curves:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>AUC (Area Under Curve) closer to 1.0 indicates better classification performance</li>
            <li>All models perform significantly better than random (diagonal line, AUC = 0.5)</li>
            <li>Curves closer to top-left corner indicate better true/false positive trade-offs</li>
          </ul>
        </div>
      </div>

      {/* Statistical Comparison */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Statistical Feature Comparison</h3>
        <p className="text-sm text-text-secondary mb-4">
          Statistical significance of feature differences between approved and unapproved CRLs
        </p>
        <div className="relative w-full" style={{ height: '600px' }}>
          <Image
            src="/images/statistical_comparison.png"
            alt="Statistical Comparison"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold mb-3">Methodology Notes</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <span className="font-medium">Training:</span> Models trained on ~240 CRLs with 5-fold cross-validation</li>
          <li>• <span className="font-medium">Test Set:</span> ~60 held-out CRLs for final evaluation</li>
          <li>• <span className="font-medium">Features:</span> Deficiency categories, application type, document metadata, language patterns</li>
          <li>• <span className="font-medium">Baseline:</span> Random guessing achieves ~68% accuracy (due to class imbalance toward approved)</li>
          <li>• <span className="font-medium">Caveat:</span> Small dataset limits model generalization; interpret with caution</li>
        </ul>
      </div>
    </div>
  )
}
