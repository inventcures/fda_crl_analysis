'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

// Flexible document type that works with both old and new search
interface CRLDocument {
  file_hash: string
  drug_name?: string
  application_number?: string
  sponsor_name?: string
  therapeutic_area?: string
  approval_status?: string
  letter_date?: string
  deficiency_categories?: string[]
  snippet?: string
  page_count?: number
  has_safety_concerns?: boolean
  has_efficacy_concerns?: boolean
  requests_new_trial?: boolean
  original_filename?: string
  [key: string]: any
}

// Accept either wrapped results (from Fuse.js) or plain documents (from hybrid search)
type SearchResult = { item: CRLDocument; score?: number; matches?: readonly any[] } | CRLDocument

interface SearchResultsProps {
  results: SearchResult[]
  isSearching: boolean
  query: string
}

// Helper to normalize result format
function normalizeResult(result: SearchResult): CRLDocument {
  if ('item' in result && result.item) {
    return result.item as CRLDocument
  }
  return result as CRLDocument
}

export default function SearchResults({ results, isSearching, query }: SearchResultsProps) {
  if (!isSearching && !query) {
    return null
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-12 border border-dashed border-border-light rounded-sm bg-subtle">
        <p className="text-xl text-text-secondary font-light">No CRLs found matching your search.</p>
        <p className="text-sm text-text-secondary mt-2 font-mono">
          Try different keywords or check your spelling.
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const item = normalizeResult(result)
        return (
          <div
            key={item.file_hash}
            className="bg-white rounded-sm border border-border-light p-6 hover:border-accent transition-colors group"
          >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-mono font-bold text-text-primary mb-2 group-hover:text-accent transition-colors">
                {item.drug_name || item.application_number || 'Unknown Drug'}
              </h3>
              <div className="flex items-center gap-3 text-sm text-text-secondary font-mono">
                <span>Application: {item.application_number || 'N/A'}</span>
                {item.sponsor_name && <span>• {item.sponsor_name}</span>}
                {item.letter_date && <span>• {item.letter_date}</span>}
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${item.approval_status === 'approved'
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
                }`}
            >
              {item.approval_status === 'approved' ? 'Eventually Approved' : 'Not Approved'}
            </span>
          </div>

          {/* Snippet */}
          <p className="text-text-primary text-sm leading-relaxed mb-4 font-light border-l-2 border-border-light pl-4 py-1">
            {item.snippet}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm flex-wrap font-mono">
            {item.therapeutic_area && item.therapeutic_area !== 'unknown' && (
              <span className="bg-accent-light text-accent px-3 py-1 rounded-sm text-xs uppercase tracking-wider">
                {item.therapeutic_area}
              </span>
            )}

            {item.deficiency_categories && item.deficiency_categories.length > 0 && (
              <span className="text-text-secondary text-xs">
                {item.deficiency_categories.length} deficiency categor{item.deficiency_categories.length === 1 ? 'y' : 'ies'}
              </span>
            )}

            {item.page_count && item.page_count > 0 && (
              <span className="text-text-secondary text-xs">
                {item.page_count} pages
              </span>
            )}

            {/* Flags */}
            {item.has_safety_concerns && (
              <span className="bg-red-50 text-error px-2 py-1 rounded-sm text-xs border border-red-100">
                Safety Concerns
              </span>
            )}
            {item.has_efficacy_concerns && (
              <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-sm text-xs border border-orange-100">
                Efficacy Concerns
              </span>
            )}
            {item.requests_new_trial && (
              <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-sm text-xs border border-purple-100">
                New Trial Required
              </span>
            )}
          </div>

          {/* Deficiency Categories */}
          {item.deficiency_categories && item.deficiency_categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.deficiency_categories.slice(0, 5).map((category) => (
                <span
                  key={category}
                  className="bg-subtle text-text-secondary px-2 py-1 rounded-sm text-xs font-mono border border-border-light"
                >
                  {category.replace('_', ' ')}
                </span>
              ))}
              {item.deficiency_categories.length > 5 && (
                <span className="text-xs text-text-secondary font-mono pt-1">
                  +{item.deficiency_categories.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* PDF Viewer Link */}
          <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border-light">
            <Link
              href={`/pdf-viewer/${item.file_hash}?q=${encodeURIComponent(query)}`}
              className="flex items-center gap-2 px-4 py-2 bg-text-primary text-white rounded-sm hover:bg-text-heading transition-colors font-mono text-sm"
            >
              <FileText size={16} />
              View in PDF
            </Link>

            <a
              href={`/pdfs/${item.file_hash}.pdf`}
              download={item.original_filename || `${item.file_hash}.pdf`}
              className="text-sm text-text-secondary hover:text-accent transition-colors font-mono"
            >
              Download PDF
            </a>
          </div>
        </div>
        )
      })}
    </div>
  )
}
