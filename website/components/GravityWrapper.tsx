'use client'

import dynamic from 'next/dynamic'

const GravityDocumentList = dynamic(() => import('./GravityDocumentList'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
      Initializing Physics Engine...
    </div>
  )
})

export default function GravityWrapper({ documents }: { documents: any[] }) {
  return <GravityDocumentList documents={documents} />
}
