import { Metadata } from 'next'
import ComparisonTool from '@/components/ComparisonTool'

export const metadata: Metadata = {
  title: 'Compare CRLs | FDA CRL Analysis',
  description: 'Compare FDA Complete Response Letters side-by-side to identify patterns and differences in deficiency profiles',
}

export default function ComparePage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Comparison Tool
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            <span className="text-text-secondary">Compare</span> CRLs
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Select up to four Complete Response Letters and compare their deficiency profiles,
            similarities, and key characteristics side-by-side.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl py-12">
        <ComparisonTool />
      </div>
    </div>
  )
}
