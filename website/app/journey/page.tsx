import { Metadata } from 'next'
import JourneySankey from '@/components/JourneySankey'

export const metadata: Metadata = {
  title: 'CRL Journey | FDA CRL Analysis',
  description: 'Visualize the flow from deficiency types to approval outcomes in FDA Complete Response Letters',
}

export default function JourneyPage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Flow Analysis
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            The <span className="text-text-secondary">Journey</span> of a CRL
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Trace the path from deficiency categories through to final approval outcomes.
            Understand which issues lead to successful rescue and which create barriers to approval.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        <JourneySankey />
      </div>
    </div>
  )
}
