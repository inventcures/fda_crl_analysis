import { Metadata } from 'next'
import PredictiveDashboard from '@/components/dashboards/PredictiveDashboard'

export const metadata: Metadata = {
  title: 'Predictive Models | FDA CRL Analysis',
  description: 'Machine learning models predicting drug approval outcomes from CRL features',
}

export default function PredictivePage() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Predictive Models</h1>
        <p className="text-lg text-gray-600 mb-8">
          Machine learning classifiers trained to predict approval outcomes based on CRL features.
          Explore model performance, feature importance, and key predictors.
        </p>
        <PredictiveDashboard />
      </div>
    </div>
  )
}
