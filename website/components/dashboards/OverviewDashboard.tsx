'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CheckCircle, XCircle, FileText, TrendingUp } from 'lucide-react'

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
  approved: '#10B981', // Emerald-500
  unapproved: '#EF4444', // Red-500
  blue: '#3B82F6', // Blue-500
}

export default function OverviewDashboard() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/overview.json')
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
        console.error('Failed to load overview data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!data) {
    return <div className="text-center py-12 text-red-600">Failed to load data</div>
  }

  // Prepare data for charts
  const appTypeData = Object.entries(data.application_types).map(([type, stats]) => ({
    name: type || 'Unknown',
    approved: stats.approved,
    unapproved: stats.unapproved,
    total: stats.total,
    approval_rate: stats.approval_rate,
  }))

  const pieData = [
    { name: 'Approved', value: data.summary.approved, color: COLORS.approved },
    { name: 'Unapproved', value: data.summary.unapproved, color: COLORS.unapproved },
  ]

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white border border-border-light p-6 group hover:border-accent transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="text-text-secondary group-hover:text-accent transition-colors" size={20} />
            <h3 className="text-text-secondary font-mono text-sm uppercase tracking-wider">Total CRLs</h3>
          </div>
          <p className="text-4xl font-mono font-bold text-text-primary">{data.summary.total_crls}</p>
        </div>

        <div className="bg-white border border-border-light p-6 group hover:border-success transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-success" size={20} />
            <h3 className="text-text-secondary font-mono text-sm uppercase tracking-wider">Approved</h3>
          </div>
          <p className="text-4xl font-mono font-bold text-success">{data.summary.approved}</p>
          <p className="text-xs font-mono text-text-secondary mt-2">
            {data.summary.approval_rate}% of total
          </p>
        </div>

        <div className="bg-white border border-border-light p-6 group hover:border-error transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="text-error" size={20} />
            <h3 className="text-text-secondary font-mono text-sm uppercase tracking-wider">Unapproved</h3>
          </div>
          <p className="text-4xl font-mono font-bold text-error">{data.summary.unapproved}</p>
          <p className="text-xs font-mono text-text-secondary mt-2">
            {(100 - data.summary.approval_rate).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white border border-border-light p-6 group hover:border-accent transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-accent" size={20} />
            <h3 className="text-text-secondary font-mono text-sm uppercase tracking-wider">Approval Rate</h3>
          </div>
          <p className="text-4xl font-mono font-bold text-accent">{data.summary.approval_rate}%</p>
          <p className="text-xs font-mono text-text-secondary mt-2">Eventually approved</p>
        </div>
      </div>

      {/* Approval Status Pie Chart */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-6">Approval Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) =>
                `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              style={{ fontFamily: 'var(--font-ubuntu-mono)', fontSize: '12px' }}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                fontFamily: 'var(--font-ubuntu-mono)',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Application Type Breakdown */}
      <div className="bg-white border border-border-light p-8">
        <h3 className="text-xl font-mono text-text-primary mb-6">Approval Outcomes by Application Type</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={appTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
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
            <Bar dataKey="approved" stackId="a" fill={COLORS.approved} name="Approved" radius={[0, 0, 4, 4]} />
            <Bar dataKey="unapproved" stackId="a" fill={COLORS.unapproved} name="Unapproved" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 text-sm text-text-secondary font-mono bg-subtle p-4 rounded-sm">
          <p className="font-bold mb-2 text-text-primary">KEY INSIGHTS:</p>
          <ul className="list-none space-y-1">
            {appTypeData
              .sort((a, b) => b.total - a.total)
              .slice(0, 3)
              .map(type => (
                <li key={type.name} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-accent rounded-full"></span>
                  {type.name}: {type.total} total ({type.approval_rate}% approval rate)
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Yearly Trends */}
      {data.yearly_trends.length > 0 && (
        <div className="bg-white border border-border-light p-8">
          <h3 className="text-xl font-mono text-text-primary mb-6">Yearly Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.yearly_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: '#475569', fontSize: 12, fontFamily: 'var(--font-ubuntu-mono)' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
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
              <Line
                type="monotone"
                dataKey="approved"
                stroke={COLORS.approved}
                strokeWidth={2}
                name="Approved"
                dot={{ r: 4, fill: COLORS.approved, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="unapproved"
                stroke={COLORS.unapproved}
                strokeWidth={2}
                name="Unapproved"
                dot={{ r: 4, fill: COLORS.unapproved, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLORS.blue}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total"
                dot={{ r: 4, fill: COLORS.blue, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-6 text-sm text-text-secondary font-light italic border-l-2 border-accent pl-4">
            Note: Data spans 2020-2025. Unapproved CRLs are concentrated in recent years
            (2024-2025) as they haven't had time for resubmission.
          </p>
        </div>
      )}
    </div>
  )
}
