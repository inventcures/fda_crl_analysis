import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import DocumentViewerWithNav from '@/components/DocumentViewerWithNav'

// Define types
interface Highlight {
  page: number
  rect: number[]
  text: string
  category: string
  type: string
  page_width: number
  page_height: number
}

export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'public/data/enriched_crls.json')
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const crls = JSON.parse(fileContents)

  return crls.map((crl: any) => ({
    id: crl.file_hash,
  }))
}

async function getData(id: string) {
  const dataDir = path.join(process.cwd(), 'public', 'data')

  // Get CRL metadata
  const crlPath = path.join(dataDir, 'enriched_crls.json')
  const crls = JSON.parse(fs.readFileSync(crlPath, 'utf8'))
  const crl = crls.find((d: any) => d.file_hash === id)

  // Get Highlights
  const highlightsPath = path.join(dataDir, 'crl_highlights.json')
  let highlights = []
  try {
    const highlightsData = JSON.parse(fs.readFileSync(highlightsPath, 'utf8'))
    if (highlightsData[id]) {
      highlights = highlightsData[id].highlights
    }
  } catch (e) {
    console.error("Could not load highlights", e)
  }

  return { crl, highlights }
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { crl, highlights } = await getData(id)

  if (!crl) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Document...</p>
        </div>
      </div>
    }>
      <DocumentViewerWithNav crl={crl} highlights={highlights} />
    </Suspense>
  )
}
