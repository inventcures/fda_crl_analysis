import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import GravityWrapper from '@/components/GravityWrapper'
import { FileText, Calendar, AlertCircle, CheckCircle } from 'lucide-react'

// Define types
interface Highlight {
  page: number
  rect: number[]
  text: string
  category: string
  type: string
}

interface HighlightsData {
  [fileHash: string]: {
    highlights: Highlight[]
  }
}

interface CRLData {
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

async function getDocuments() {
  const dataDir = path.join(process.cwd(), 'public', 'data')
  
  // Read CRL data
  const crlPath = path.join(dataDir, 'enriched_crls.json')
  const crlData: CRLData[] = JSON.parse(fs.readFileSync(crlPath, 'utf8'))
  
  // Read Highlights data to filter (optional, we can show all but visual cues depend on it)
  // For now, let's just show all available enriched CRLs to maximize the visual impact
  // But we prefer those with highlights for the viewer
  const highlightsPath = path.join(dataDir, 'crl_highlights.json')
  let highlightsData: HighlightsData = {}
  try {
    highlightsData = JSON.parse(fs.readFileSync(highlightsPath, 'utf8'))
  } catch (e) {
    console.error("Could not load highlights data", e)
  }
  
  // Prioritize docs with highlights
  const withHighlights = crlData.filter(doc => highlightsData[doc.file_hash])
  const withoutHighlights = crlData.filter(doc => !highlightsData[doc.file_hash])
  
  return [...withHighlights, ...withoutHighlights]
}

export default async function DocumentViewPage() {
  const documents = await getDocuments()
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Live Document Archive</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
             Interactive exploration of {documents.length} FDA Complete Response Letters. 
             Browse the archive to uncover patterns in regulatory decision-making.
          </p>
        </div>

        {/* Unified Grid View */}
        <div className="mb-16">
           <GravityWrapper documents={documents} />
        </div>
      </div>
    </div>
  )
}
