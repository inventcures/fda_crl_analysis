import { Metadata } from 'next'
import OverviewDashboard from '@/components/dashboards/OverviewDashboard'

export const metadata: Metadata = {
  title: 'Overview Dashboard | FDA CRL Analysis',
  description: 'High-level statistics and trends in FDA Complete Response Letters',
}

export default function OverviewPage() {
  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4 text-text-primary">Overview Dashboard</h1>
        <p className="text-lg text-text-secondary mb-8">
          High-level statistics, approval rates, and trends across the dataset of ~300 FDA Complete Response Letters.
        </p>
        <OverviewDashboard />
      </div>
    </div>
  )
}
