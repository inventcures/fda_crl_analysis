import { Metadata } from 'next'
import PredictiveDashboard from '@/components/dashboards/PredictiveDashboard'

export const metadata: Metadata = {
  title: 'Predictive Models | FDA CRL Analysis',
  description: 'Machine learning models predicting drug approval outcomes from CRL features',
}

export default function PredictivePage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="border-b border-border-light py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent-subtle text-accent font-mono text-xs uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Predictive Modeling
          </div>
          <h1 className="text-5xl font-normal mb-6 text-text-primary leading-tight">
            Forecasting <span className="text-text-secondary">Outcomes</span>
          </h1>
          <p className="text-xl text-text-secondary font-light max-w-3xl leading-relaxed">
            Machine learning classifiers trained to predict approval outcomes based on CRL features.
            Explore model performance, feature importance, and key predictors.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl py-12">
        <PredictiveDashboard />
      </div>
    </div>
  )
}
