import { Metadata } from 'next'
import OverviewDashboard from '@/components/dashboards/OverviewDashboard'

export const metadata: Metadata = {
  title: 'Overview Dashboard | FDA CRL Analysis',
  description: 'High-level statistics and trends in FDA Complete Response Letters',
}

export default function OverviewPage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Dataset Overview
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            The Landscape of <span className="text-text-secondary">Approval</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            High-level statistics, approval rates, and trends across the dataset of ~300 FDA Complete Response Letters.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        <OverviewDashboard />
      </div>
    </div>
  )
}
