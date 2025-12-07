import { promises as fs } from 'fs'
import path from 'path'
import { Suspense } from 'react'
import PDFViewerClient from './PDFViewerClient'

// Generate static params for all PDF file hashes
export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'public/data/search_crls.json')
  const fileContents = await fs.readFile(filePath, 'utf8')
  const crls = JSON.parse(fileContents)

  return crls.map((crl: any) => ({
    fileHash: crl.file_hash,
  }))
}

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fda-blue"></div>
    </div>
  )
}

export default async function PDFViewerPage({ params }: { params: Promise<{ fileHash: string }> }) {
  const { fileHash } = await params
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PDFViewerClient fileHash={fileHash} />
    </Suspense>
  )
}
