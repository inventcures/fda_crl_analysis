'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { CRLDocument } from '@/lib/useSearch'

interface SearchResultsProps {
  results: Array<{ item: CRLDocument; score?: number; matches?: readonly any[] }>
  isSearching: boolean
  query: string
}

export default function SearchResults({ results, isSearching, query }: SearchResultsProps) {
  if (!isSearching) {
    return null
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No CRLs found matching your search.</p>
        <p className="text-sm text-gray-500 mt-2">
          Try different keywords or check your spelling.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map(({ item, score }) => (
        <div
          key={item.file_hash}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {item.drug_name || item.application_number || 'Unknown Drug'}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Application: {item.application_number || 'N/A'}</span>
                {item.sponsor_name && <span>• {item.sponsor_name}</span>}
                {item.letter_date && <span>• {item.letter_date}</span>}
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.approval_status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {item.approval_status === 'approved' ? 'Eventually Approved' : 'Not Approved'}
            </span>
          </div>

          {/* Snippet */}
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            {item.snippet}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {item.therapeutic_area && item.therapeutic_area !== 'unknown' && (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {item.therapeutic_area}
              </span>
            )}

            {item.deficiency_categories.length > 0 && (
              <span className="text-gray-600">
                {item.deficiency_categories.length} deficiency categor{item.deficiency_categories.length === 1 ? 'y' : 'ies'}
              </span>
            )}

            {item.page_count > 0 && (
              <span className="text-gray-600">
                {item.page_count} pages
              </span>
            )}

            {/* Flags */}
            {item.has_safety_concerns && (
              <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                Safety Concerns
              </span>
            )}
            {item.has_efficacy_concerns && (
              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs">
                Efficacy Concerns
              </span>
            )}
            {item.requests_new_trial && (
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                New Trial Required
              </span>
            )}
          </div>

          {/* Deficiency Categories */}
          {item.deficiency_categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.deficiency_categories.slice(0, 5).map((category) => (
                <span
                  key={category}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  {category.replace('_', ' ')}
                </span>
              ))}
              {item.deficiency_categories.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{item.deficiency_categories.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* PDF Viewer Link */}
          <div className="mt-4 flex items-center gap-3">
            <Link
              href={`/pdf-viewer/${item.file_hash}?q=${encodeURIComponent(query)}`}
              className="flex items-center gap-2 px-4 py-2 bg-fda-blue text-white rounded hover:bg-opacity-90 transition"
            >
              <FileText size={16} />
              View in PDF
            </Link>

            <a
              href={`/pdfs/${item.file_hash}.pdf`}
              download
              className="text-sm text-gray-600 hover:text-fda-blue"
            >
              Download PDF
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
