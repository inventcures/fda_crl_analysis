import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import InteractivePDFViewer from '@/components/InteractivePDFViewer'

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
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <InteractivePDFViewer 
        fileUrl={`/pdfs/${id}.pdf`}
        fileName={`${crl.application_number}_CRL.pdf`}
        highlights={highlights}
      />
    </div>
  )
}
