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
  LabelList
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
  accuracy: '#3b82f6', // Blue-500
  cv_mean: '#059669', // Emerald-600
  cv_std: '#ef4444', // Red-500
  grid: '#e2e8f0',
  text: '#64748b'
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

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  // Prepare radar data for model comparison
  const radarData = data.models.map(model => ({
    name: model.name.split(' ')[0], // Shorten name for radar
    accuracy: model.accuracy,
    cv_mean: model.cv_mean,
    stability: 100 - model.cv_std, // Convert std to stability score
  }))

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* SECTION 1: Best Model */}
      {data.best_model && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-green-50 p-3 rounded-full">
              <Award size={32} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top Performer: {data.best_model.name}</h2>
              <p className="text-gray-500 text-sm">Highest cross-validation accuracy with consistent stability.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
               <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Test Accuracy</div>
               <div className="text-4xl font-bold text-blue-600">{data.best_model.accuracy}%</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
               <div className="text-xs text-green-700 uppercase tracking-wider mb-2 font-semibold">Cross-Validation Score</div>
               <div className="text-4xl font-bold text-emerald-600">{data.best_model.cv_mean}%</div>
               <div className="text-xs text-green-600 mt-1">±{data.best_model.cv_std}% std dev</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
               <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Model Type</div>
               <div className="text-lg font-bold text-gray-800 mt-2">{data.best_model.name}</div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Model Comparison */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Model Benchmarking</h2>
          <p className="text-gray-500 text-sm">Comparing generalization performance across different algorithms.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Accuracy Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.models} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: COLORS.text, fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: COLORS.text, fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                   cursor={{ fill: '#f1f5f9' }}
                   contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="cv_mean" name="CV Mean Accuracy" fill={COLORS.cv_mean} radius={[4, 4, 0, 0]} />
                <Bar dataKey="accuracy" name="Test Set Accuracy" fill={COLORS.accuracy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Multi-Metric Profile</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke={COLORS.grid} />
                <PolarAngleAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Test Acc" dataKey="accuracy" stroke={COLORS.accuracy} fill={COLORS.accuracy} fillOpacity={0.1} />
                <Radar name="CV Mean" dataKey="cv_mean" stroke={COLORS.cv_mean} fill={COLORS.cv_mean} fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 3: Feature Importance */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Predictive Drivers</h2>
          <p className="text-gray-500 text-sm">Which features carry the most weight in predicting approval outcomes?</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           {/* Feature List */}
           <div className="lg:col-span-1 space-y-3">
              <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider mb-3">Top Features</h3>
              {data.features.map((feature, idx) => (
                <div key={feature.feature} className="bg-white border border-gray-200 p-3 rounded flex items-center gap-3 shadow-sm">
                   <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                     {idx + 1}
                   </div>
                   <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                </div>
              ))}
           </div>

           {/* Feature Importance Plot */}
           <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 h-[400px] relative">
              <Image
                src="/images/feature_importance.png"
                alt="Feature Importance"
                fill
                style={{ objectFit: 'contain' }}
              />
           </div>
        </div>
      </section>

      {/* SECTION 4: ROC & Stats */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
           <h3 className="text-lg font-bold text-gray-900 mb-4">ROC Curves</h3>
           <div className="bg-white border border-gray-200 rounded-lg p-2 h-[400px] relative">
             <Image
               src="/images/roc_curves.png"
               alt="ROC Curves"
               fill
               style={{ objectFit: 'contain' }}
             />
           </div>
           <p className="mt-2 text-xs text-gray-500 text-center">Trade-off between True Positive Rate and False Positive Rate.</p>
        </div>

        <div>
           <h3 className="text-lg font-bold text-gray-900 mb-4">Statistical Significance</h3>
           <div className="bg-white border border-gray-200 rounded-lg p-2 h-[400px] relative">
             <Image
               src="/images/statistical_comparison.png"
               alt="Statistical Comparison"
               fill
               style={{ objectFit: 'contain' }}
             />
           </div>
        </div>
      </section>
    </div>
  )
}
