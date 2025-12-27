import fs from 'fs'
import path from 'path'
import DocumentViewerWrapper from '@/components/DocumentViewerWrapper'

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

  return <DocumentViewerWrapper documents={documents} />
}
