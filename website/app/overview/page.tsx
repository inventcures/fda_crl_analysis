import { Metadata } from 'next'
import OverviewDashboard from '@/components/dashboards/OverviewDashboard'

export const metadata: Metadata = {
  title: 'Overview Dashboard | FDA CRL Analysis',
  description: 'High-level statistics and trends in FDA Complete Response Letters',
}

export default function OverviewPage() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Overview Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">
          High-level statistics, approval rates, and trends across the dataset of ~300 FDA Complete Response Letters.
        </p>
        <OverviewDashboard />
      </div>
    </div>
  )
}
