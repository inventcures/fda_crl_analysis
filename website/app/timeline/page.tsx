import { Metadata } from 'next'
import TimelineExplorer from '@/components/TimelineExplorer'

export const metadata: Metadata = {
  title: 'Timeline | FDA CRL Analysis',
  description: 'Explore the temporal distribution of FDA Complete Response Letters and track trends over time',
}

export default function TimelinePage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Temporal Analysis
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            CRL <span className="text-text-secondary">Timeline</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Track the distribution of Complete Response Letters over time.
            Explore monthly and yearly trends, and drill down into specific time periods.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        <TimelineExplorer />
      </div>
    </div>
  )
}
