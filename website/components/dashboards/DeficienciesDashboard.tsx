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
  approved: '#10B981', // Emerald-500
  unapproved: '#EF4444', // Red-500
  rescueRate: '#3B82F6', // Blue-500
}

export default function DeficienciesDashboard() {
  const [data, setData] = useState<DeficiencyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/deficiencies.json')
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
        console.error('Failed to load deficiency data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!data) {
    return <div className="text-center py-12 text-red-600">Failed to load data</div>
  }

  // Prepare frequency data
  const frequencyData = data.categories.map(cat => ({
    name: cat.category_label.length > 20
      ? cat.category_label.substring(0, 20) + '...'
      : cat.category_label,
    fullName: cat.category_label,
    total: cat.total,
    approved: cat.approved,
    unapproved: cat.unapproved,
  }))

  // Prepare rescue rate data
  const rescueData = data.categories.map(cat => ({
    name: cat.category_label.length > 20
      ? cat.category_label.substring(0, 20) + '...'
      : cat.category_label,
    fullName: cat.category_label,
    rescue_rate: cat.rescue_rate,
  }))

  // Prepare radar chart data
  const radarData = data.categories.slice(0, 6).map(cat => ({
    category: cat.category_label.split(' ').slice(0, 2).join(' '),
    frequency: Math.round((cat.total / 300) * 100), // Normalize to percentage
    rescue_rate: cat.rescue_rate,
  }))

  return (
    <div className="space-y-8">
      {/* Deficiency Frequency */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-6">Deficiency Frequency by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={frequencyData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-4 border border-border-light shadow-lg font-mono text-sm">
                      <p className="font-bold mb-2 text-text-primary">{data.fullName}</p>
                      <div className="space-y-1">
                        <p className="text-success">Approved: {data.approved}</p>
                        <p className="text-error">Unapproved: {data.unapproved}</p>
                        <p className="text-text-secondary pt-1 border-t border-border-light mt-1">Total: {data.total}</p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'var(--font-ubuntu-mono)', fontSize: '12px', paddingTop: '20px' }} />
            <Bar dataKey="approved" fill={COLORS.approved} name="Approved" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar dataKey="unapproved" fill={COLORS.unapproved} name="Unapproved" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rescue Rates */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-4">Rescue Rates by Deficiency Category</h3>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Percentage of CRLs with each deficiency type that were eventually approved
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={rescueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              label={{ value: 'Rescue Rate (%)', angle: -90, position: 'insideLeft', style: { fontFamily: 'var(--font-ubuntu-mono)', fill: '#64748B' } }}
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-4 border border-border-light shadow-lg font-mono text-sm">
                      <p className="font-bold mb-2 text-text-primary">{data.fullName}</p>
                      <p className="text-accent">Rescue Rate: {data.rescue_rate}%</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="rescue_rate" fill={COLORS.rescueRate} name="Rescue Rate %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 text-sm text-text-secondary font-mono bg-subtle p-4 rounded-sm">
          <p className="font-bold mb-2 text-text-primary">KEY INSIGHTS:</p>
          <ul className="list-none space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              CMC/Manufacturing issues have the highest rescue rate (~86%)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              Safety and Labeling issues have lower rescue rates (~68-69%)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">→</span>
              Suggests manufacturing issues are more easily resolved than safety concerns
            </li>
          </ul>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-6">Deficiency Pattern Overview</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} />
            <Radar
              name="Frequency %"
              dataKey="frequency"
              stroke={COLORS.rescueRate}
              fill={COLORS.rescueRate}
              fillOpacity={0.2}
            />
            <Radar
              name="Rescue Rate %"
              dataKey="rescue_rate"
              stroke={COLORS.approved}
              fill={COLORS.approved}
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
      </div>

      {/* Key Flags Impact */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-4">Key Flags and Their Impact</h3>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Critical indicators found in CRL text and their correlation with approval outcomes
        </p>
        <div className="space-y-4">
          {data.key_flags.map(flag => {
            const isHighImpact = flag.impact_score > 50
            return (
              <div
                key={flag.flag}
                className={`border-l-4 p-5 rounded-sm transition-all hover:shadow-sm ${isHighImpact ? 'border-error bg-red-50/30' : 'border-success bg-green-50/30'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isHighImpact ? (
                      <AlertCircle className="text-error" size={20} />
                    ) : (
                      <CheckCircle2 className="text-success" size={20} />
                    )}
                    <h4 className="font-mono font-medium text-lg text-text-primary">{flag.label}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-text-primary">{flag.impact_score}%</div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider">Unapproved rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                  <div>
                    <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">Total</div>
                    <div className="font-bold">{flag.total}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">Approved</div>
                    <div className="font-bold text-success">{flag.approved}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">Unapproved</div>
                    <div className="font-bold text-error">{flag.unapproved}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Co-occurrence Heatmap Image */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-4">Deficiency Co-occurrence Heatmap</h3>
        <p className="text-sm text-text-secondary mb-6 font-light">
          Shows which deficiency types commonly appear together in the same CRL
        </p>
        <div className="relative w-full bg-subtle rounded-sm p-4" style={{ height: '600px' }}>
          <Image
            src="/images/cooccurrence_heatmap.png"
            alt="Deficiency Co-occurrence Heatmap"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}
