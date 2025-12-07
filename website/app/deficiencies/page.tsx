import { Metadata } from 'next'
import DeficienciesDashboard from '@/components/dashboards/DeficienciesDashboard'

export const metadata: Metadata = {
  title: 'Deficiency Analysis | FDA CRL Analysis',
  description: 'Deep dive into deficiency categories and their impact on approval outcomes',
}

export default function DeficienciesPage() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Deficiency Analysis</h1>
        <p className="text-lg text-gray-600 mb-8">
          Explore deficiency categories, co-occurrence patterns, and key flags that impact drug approval outcomes.
        </p>
        <DeficienciesDashboard />
      </div>
    </div>
  )
}
