'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'

interface OverviewData {
  summary: {
    total_crls: number
    approved: number
    unapproved: number
    approval_rate: number
  }
  application_types: {
    [key: string]: {
      total: number
      approved: number
      unapproved: number
      approval_rate: number
    }
  }
  yearly_trends: Array<{
    year: string
    approved: number
    unapproved: number
    total: number
  }>
}

const COLORS = {
  approved: '#059669', // Emerald-600 (Darker/Rich)
  unapproved: '#94a3b8', // Slate-400 (Neutral/Negative)
  total: '#1e293b', // Slate-800
}

export default function OverviewDashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/overview.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load overview data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load data</div>

  // Prepare data for charts
  // Sort by total volume for better readability in horizontal bar chart
  const appTypeData = Object.entries(data.application_types)
    .map(([type, stats]) => ({
      name: type || 'Unknown',
      approved: stats.approved,
      unapproved: stats.unapproved,
      total: stats.total,
      approval_rate: stats.approval_rate,
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* SECTION 1: Approval Outcomes by Application Type */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Outcomes by Application Type</h2>
          <p className="text-gray-500 text-sm">Comparing total volume and approval success across different submission types.</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              layout="vertical" 
              data={appTypeData} 
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#334155', fontSize: 13, fontWeight: 500 }} 
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="approved" name="Approved" stackId="a" fill={COLORS.approved} barSize={32} radius={[0, 4, 4, 0]}>
                 <LabelList dataKey="approved" position="center" fill="white" fontSize={12} formatter={(val: number) => val > 0 ? val : ''} />
              </Bar>
              <Bar dataKey="unapproved" name="Unapproved" stackId="a" fill={COLORS.unapproved} barSize={32} radius={[0, 4, 4, 0]}>
                 <LabelList dataKey="unapproved" position="center" fill="white" fontSize={12} formatter={(val: number) => val > 0 ? val : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-500 italic text-center">
            *Sorted by total submission volume. 'NDA' = New Drug Application, 'BLA' = Biologics License Application.
          </div>
        </div>
      </section>

      {/* SECTION 2: Temporal Trends */}
      {data.yearly_trends.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Yearly Submission Trends</h2>
            <p className="text-gray-500 text-sm">Tracking the volume of CRLs and subsequent approvals over time.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.yearly_trends} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
                  axisLine={{ stroke: '#cbd5e1' }} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="plainline" />
                
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name="Total CRLs" 
                  stroke={COLORS.total} 
                  strokeWidth={2} 
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  name="Approved" 
                  stroke={COLORS.approved} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: COLORS.approved, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-sm text-gray-500 bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
              <strong>Note:</strong> Lower approval counts in recent years (2024-2025) reflect the lag time between receiving a CRL and resubmitting/gaining approval, rather than a decrease in approval rates.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
