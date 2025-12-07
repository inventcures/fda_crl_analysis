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
  approved: '#00a91c',
  unapproved: '#e52207',
  blue: '#005ea2',
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-gray-600" size={24} />
            <h3 className="text-gray-600 font-medium">Total CRLs</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">{data.summary.total_crls}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-fda-green">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-fda-green" size={24} />
            <h3 className="text-gray-600 font-medium">Approved</h3>
          </div>
          <p className="text-3xl font-bold text-fda-green">{data.summary.approved}</p>
          <p className="text-sm text-gray-500 mt-1">
            {data.summary.approval_rate}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-fda-red">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="text-fda-red" size={24} />
            <h3 className="text-gray-600 font-medium">Unapproved</h3>
          </div>
          <p className="text-3xl font-bold text-fda-red">{data.summary.unapproved}</p>
          <p className="text-sm text-gray-500 mt-1">
            {(100 - data.summary.approval_rate).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-fda-blue">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-fda-blue" size={24} />
            <h3 className="text-gray-600 font-medium">Approval Rate</h3>
          </div>
          <p className="text-3xl font-bold text-fda-blue">{data.summary.approval_rate}%</p>
          <p className="text-sm text-gray-500 mt-1">Eventually approved</p>
        </div>
      </div>

      {/* Approval Status Pie Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Approval Status Distribution</h3>
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
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Application Type Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Approval Outcomes by Application Type</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={appTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" stackId="a" fill={COLORS.approved} name="Approved" />
            <Bar dataKey="unapproved" stackId="a" fill={COLORS.unapproved} name="Unapproved" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Key Insights:</p>
          <ul className="list-disc list-inside space-y-1">
            {appTypeData
              .sort((a, b) => b.total - a.total)
              .slice(0, 3)
              .map(type => (
                <li key={type.name}>
                  {type.name}: {type.total} total ({type.approval_rate}% approval rate)
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Yearly Trends */}
      {data.yearly_trends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Yearly Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.yearly_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="approved"
                stroke={COLORS.approved}
                strokeWidth={2}
                name="Approved"
              />
              <Line
                type="monotone"
                dataKey="unapproved"
                stroke={COLORS.unapproved}
                strokeWidth={2}
                name="Unapproved"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLORS.blue}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-4 text-sm text-gray-600">
            Note: Data spans 2020-2025. Unapproved CRLs are concentrated in recent years
            (2024-2025) as they haven't had time for resubmission.
          </p>
        </div>
      )}
    </div>
  )
}
