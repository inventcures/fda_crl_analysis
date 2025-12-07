'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Search } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  fileUrl: string
  searchQuery?: string
  initialPage?: number
}

export default function PDFViewer({ fileUrl, searchQuery, initialPage = 1 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [scale, setScale] = useState(1.0)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const goToPrevPage = () => setPageNumber(Math.max(1, pageNumber - 1))
  const goToNextPage = () => setPageNumber(Math.min(numPages, pageNumber + 1))
  const zoomIn = () => setScale(Math.min(3.0, scale + 0.25))
  const zoomOut = () => setScale(Math.max(0.5, scale - 0.25))

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
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
          download
          className="flex items-center gap-2 px-4 py-2 bg-fda-blue text-white rounded hover:bg-opacity-90 transition"
        >
          <Download size={16} />
          Download PDF
        </a>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
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
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  )
}
