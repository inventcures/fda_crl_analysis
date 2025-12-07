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
  approved: '#00a91c',
  unapproved: '#e52207',
  rescueRate: '#005ea2',
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
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Deficiency Frequency by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={frequencyData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-sm text-success">Approved: {data.approved}</p>
                      <p className="text-sm text-error">Unapproved: {data.unapproved}</p>
                      <p className="text-sm font-medium">Total: {data.total}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Bar dataKey="approved" fill={COLORS.approved} name="Approved" />
            <Bar dataKey="unapproved" fill={COLORS.unapproved} name="Unapproved" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rescue Rates */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Rescue Rates by Deficiency Category</h3>
        <p className="text-sm text-text-secondary mb-4">
          Percentage of CRLs with each deficiency type that were eventually approved
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={rescueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
            <YAxis domain={[0, 100]} label={{ value: 'Rescue Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                      <p className="font-semibold">{data.fullName}</p>
                      <p className="text-sm">Rescue Rate: {data.rescue_rate}%</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="rescue_rate" fill={COLORS.rescueRate} name="Rescue Rate %" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-text-secondary">
          <p className="font-medium mb-2">Key Insights:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>CMC/Manufacturing issues have the highest rescue rate (~86%)</li>
            <li>Safety and Labeling issues have lower rescue rates (~68-69%)</li>
            <li>Suggests manufacturing issues are more easily resolved than safety concerns</li>
          </ul>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Deficiency Pattern Overview</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Frequency %"
              dataKey="frequency"
              stroke="#005ea2"
              fill="#005ea2"
              fillOpacity={0.3}
            />
            <Radar
              name="Rescue Rate %"
              dataKey="rescue_rate"
              stroke="#00a91c"
              fill="#00a91c"
              fillOpacity={0.3}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Flags Impact */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Key Flags and Their Impact</h3>
        <p className="text-sm text-text-secondary mb-4">
          Critical indicators found in CRL text and their correlation with approval outcomes
        </p>
        <div className="space-y-4">
          {data.key_flags.map(flag => {
            const isHighImpact = flag.impact_score > 50
            return (
              <div
                key={flag.flag}
                className={`border-l-4 p-4 rounded ${
                  isHighImpact ? 'border-error bg-red-50' : 'border-success bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isHighImpact ? (
                      <AlertCircle className="text-error" size={20} />
                    ) : (
                      <CheckCircle2 className="text-success" size={20} />
                    )}
                    <h4 className="font-semibold text-lg">{flag.label}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-text-primary">{flag.impact_score}%</div>
                    <div className="text-xs text-text-secondary">Unapproved rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary">Total</div>
                    <div className="font-semibold">{flag.total}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Approved</div>
                    <div className="font-semibold text-success">{flag.approved}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Unapproved</div>
                    <div className="font-semibold text-error">{flag.unapproved}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Co-occurrence Heatmap Image */}
      <div className="bg-white border border-border-light p-6">
        <h3 className="text-xl font-semibold mb-4">Deficiency Co-occurrence Heatmap</h3>
        <p className="text-sm text-text-secondary mb-4">
          Shows which deficiency types commonly appear together in the same CRL
        </p>
        <div className="relative w-full" style={{ height: '600px' }}>
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
