'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Search } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker - use multiple CDN fallbacks for reliability
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
  searchQuery?: string
  initialPage?: number
}

export default function PDFViewer({ fileUrl, fileName, searchQuery, initialPage = 1 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [scale, setScale] = useState(1.0)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const scrollToPage = (pageNum: number) => {
    const pageElement = document.getElementById(`page_${pageNum}`)
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setPageNumber(pageNum)
    }
  }

  const goToPrevPage = () => {
    const prevPage = Math.max(1, pageNumber - 1)
    scrollToPage(prevPage)
  }

  const goToNextPage = () => {
    const nextPage = Math.min(numPages, pageNumber + 1)
    scrollToPage(nextPage)
  }

  const zoomIn = () => setScale(Math.min(3.0, scale + 0.25))
  const zoomOut = () => setScale(Math.max(0.5, scale - 0.25))

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - Fixed */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
            <button onClick={zoomOut} className="p-2 rounded hover:bg-gray-100">
              <ZoomOut size={20} />
            </button>
            <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-2 rounded hover:bg-gray-100">
              <ZoomIn size={20} />
            </button>
          </div>

          {/* Search Indicator */}
          {searchQuery && (
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <Search size={16} className="text-fda-blue" />
              <span className="text-sm text-gray-600">
                Searching for: <strong>{searchQuery}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Download Button */}
        <a
          href={fileUrl}
          download={fileName || 'document.pdf'}
          className="flex items-center gap-2 px-4 py-2 bg-fda-blue text-white rounded hover:bg-opacity-90 transition"
        >
          <Download size={16} />
          Download PDF
        </a>
      </div>

      {/* PDF Canvas - All Pages Scrollable (only this section scrolls) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100">
        <div className="flex flex-col items-center gap-4 p-8">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fda-blue"></div>
              </div>
            }
            error={
              <div className="text-center py-24">
                <p className="text-red-600 font-semibold">Error loading PDF</p>
                <p className="text-sm text-gray-600 mt-2">
                  Please check that the file exists and try again.
                </p>
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} id={`page_${index + 1}`} className="mb-4">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg bg-white"
                />
                <div className="text-center mt-2 text-sm text-gray-600">
                  Page {index + 1} of {numPages}
                </div>
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  )
}
