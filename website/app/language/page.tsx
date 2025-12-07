import { Metadata } from 'next'
import LanguageDashboard from '@/components/dashboards/LanguageDashboard'

export const metadata: Metadata = {
  title: 'Language Analysis | FDA CRL Analysis',
  description: 'NLP insights, sentiment analysis, and language patterns in FDA Complete Response Letters',
}

export default function LanguagePage() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Language & Sentiment Analysis</h1>
        <p className="text-lg text-gray-600 mb-8">
          NLP-powered insights into FDA language patterns, severity scoring, sentiment analysis,
          and semantic embeddings of CRL documents.
        </p>
        <LanguageDashboard />
      </div>
    </div>
  )
}
