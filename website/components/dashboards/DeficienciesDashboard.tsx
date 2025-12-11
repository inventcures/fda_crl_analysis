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
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface DeficiencyData {
  categories: Array<{
    category: string
    category_label: string
    total: number
    approved: number
    unapproved: number
    rescue_rate: number
  }>
  cooccurrence: {
    categories: string[]
    matrix: number[][]
  }
  key_flags: Array<{
    flag: string
    label: string
    approved: number
    unapproved: number
    total: number
    impact_score: number
  }>
}

const COLORS = {
  approved: '#059669', // Emerald-600
  unapproved: '#94a3b8', // Slate-400
  rescueRate: '#3b82f6', // Blue-500
  grid: '#e2e8f0',
  text: '#64748b'
}

export default function DeficienciesDashboard() {
  const [data, setData] = useState<DeficiencyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/deficiencies.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load deficiency data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  // Prepare frequency data - Sorted by total count for vertical chart
  const frequencyData = [...data.categories]
    .sort((a, b) => b.total - a.total)
    .map(cat => ({
      name: cat.category_label,
      total: cat.total,
      approved: cat.approved,
      unapproved: cat.unapproved,
    }))

  // Prepare rescue rate data - Sorted by rescue rate
  const rescueData = [...data.categories]
    .sort((a, b) => b.rescue_rate - a.rescue_rate)
    .map(cat => ({
      name: cat.category_label,
      rescue_rate: cat.rescue_rate,
    }))

  // Prepare radar chart data
  const radarData = data.categories.slice(0, 6).map(cat => ({
    category: cat.category_label.split(' ').slice(0, 2).join(' '),
    frequency: Math.round((cat.total / 300) * 100), // Normalize
    rescue_rate: cat.rescue_rate,
  }))

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* SECTION 1: Frequency */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Deficiency Frequency</h2>
          <p className="text-gray-500 text-sm">Most common issues cited in CRLs, broken down by final approval outcome.</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              layout="vertical" 
              data={frequencyData} 
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grid} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{ fill: '#334155', fontSize: 13, fontWeight: 500 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                 cursor={{ fill: '#f1f5f9' }}
                 contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="approved" name="Approved" stackId="a" fill={COLORS.approved} barSize={24} radius={[0, 4, 4, 0]} />
              <Bar dataKey="unapproved" name="Unapproved" stackId="a" fill={COLORS.unapproved} barSize={24} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION 2: Rescue Rates */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Rescue Rates</h2>
          <p className="text-gray-500 text-sm">Percentage of CRLs with specific deficiencies that were eventually approved.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={rescueData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval={0}
                tick={{ fill: COLORS.text, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: COLORS.text, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                label={{ value: '% Approved', angle: -90, position: 'insideLeft', style: { fill: COLORS.text } }}
              />
              <Tooltip 
                 cursor={{ fill: '#f1f5f9' }}
                 contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="rescue_rate" name="Rescue Rate %" fill={COLORS.rescueRate} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="rescue_rate" position="top" formatter={(val: number) => `${val}%`} fill={COLORS.text} fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
            <h4 className="text-sm font-bold text-blue-900 uppercase mb-2">Key Insights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>CMC/Manufacturing</strong> issues have the highest rescue rate (~86%).</li>
              <li>• <strong>Safety</strong> and <strong>Labeling</strong> issues are harder to resolve (~69% rescue rate).</li>
              <li>• This suggests manufacturing issues are often technical hurdles, while safety concerns are fundamental.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: Key Flags */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Critical Indicators</h2>
          <p className="text-gray-500 text-sm">Specific terms in CRLs that strongly correlate with final outcomes.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {data.key_flags.map(flag => {
            const isHighImpact = flag.impact_score > 50
            return (
              <div
                key={flag.flag}
                className={`p-5 rounded-lg border transition-all ${
                  isHighImpact 
                    ? 'border-red-200 bg-red-50 hover:shadow-md' 
                    : 'border-green-200 bg-green-50 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isHighImpact ? <AlertCircle className="text-red-500" size={20} /> : <CheckCircle2 className="text-green-500" size={20} />}
                    <h4 className="font-bold text-gray-900">{flag.label}</h4>
                  </div>
                  <span className={`text-2xl font-bold ${isHighImpact ? 'text-red-600' : 'text-green-600'}`}>
                    {flag.impact_score}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Unapproval Rate</p>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-white/60 p-2 rounded">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-semibold">{flag.total}</div>
                  </div>
                  <div className="bg-white/60 p-2 rounded">
                    <div className="text-xs text-gray-500">Apprv</div>
                    <div className="font-semibold text-green-600">{flag.approved}</div>
                  </div>
                  <div className="bg-white/60 p-2 rounded">
                    <div className="text-xs text-gray-500">Unapprv</div>
                    <div className="font-semibold text-red-600">{flag.unapproved}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 4: Radar & Heatmap (Visual Overview) */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
           <h3 className="text-lg font-bold text-gray-900 mb-4">Deficiency Profile</h3>
           <div className="bg-white border border-gray-200 rounded-lg p-4 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Frequency %" dataKey="frequency" stroke={COLORS.rescueRate} fill={COLORS.rescueRate} fillOpacity={0.3} />
                  <Radar name="Rescue Rate %" dataKey="rescue_rate" stroke={COLORS.approved} fill={COLORS.approved} fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>
        
        <div>
           <h3 className="text-lg font-bold text-gray-900 mb-4">Co-occurrence Heatmap</h3>
           <div className="bg-white border border-gray-200 rounded-lg p-2 h-[400px] relative">
              <Image
                src="/images/cooccurrence_heatmap.png"
                alt="Deficiency Co-occurrence Heatmap"
                fill
                style={{ objectFit: 'contain' }}
                className="p-2"
              />
           </div>
        </div>
      </section>
    </div>
  )
}
