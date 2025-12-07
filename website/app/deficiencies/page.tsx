import { Metadata } from 'next'
import DeficienciesDashboard from '@/components/dashboards/DeficienciesDashboard'

export const metadata: Metadata = {
  title: 'Deficiency Analysis | FDA CRL Analysis',
  description: 'Deep dive into deficiency categories and their impact on approval outcomes',
}

export default function DeficienciesPage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Deficiency Analysis
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            Anatomy of <span className="text-text-secondary">Failure</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Explore deficiency categories, co-occurrence patterns, and key flags that impact drug approval outcomes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        <DeficienciesDashboard />
      </div>
    </div>
  )
}
