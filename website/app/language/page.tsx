import { Metadata } from 'next'
import LanguageDashboard from '@/components/dashboards/LanguageDashboard'

export const metadata: Metadata = {
  title: 'Language Analysis | FDA CRL Analysis',
  description: 'NLP insights, sentiment analysis, and language patterns in FDA Complete Response Letters',
}

export default function LanguagePage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            NLP Analysis
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            The Language of <span className="text-text-secondary">Rejection</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            By analyzing the specific vocabulary and sentiment patterns in FDA letters,
            we can quantify the severity of regulatory feedback and predict approval outcomes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        <LanguageDashboard />
      </div>
    </div>
  )
}
