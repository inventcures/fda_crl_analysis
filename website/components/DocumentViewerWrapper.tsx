'use client'

import dynamic from 'next/dynamic'

const DocumentViewerLayout = dynamic(() => import('./DocumentViewerLayout'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading Document Archive...</p>
      </div>
    </div>
  ),
})

interface Document {
  file_hash: string
  drug_name: string
  application_number: string
  approval_status: string
  letter_date: string
  deficiency_categories: string[]
  enriched?: {
    openfda_brand_name?: string
  }
}

export default function DocumentViewerWrapper({ documents }: { documents: Document[] }) {
  return <DocumentViewerLayout documents={documents} />
}
