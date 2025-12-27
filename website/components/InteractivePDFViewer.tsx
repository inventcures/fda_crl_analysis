'use client'

import { useState, useRef, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Eye, EyeOff, AlertTriangle, CheckCircle, Info, Activity } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import * as Tooltip from '@radix-ui/react-tooltip'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

interface Highlight {
  page: number
  rect: number[] // [x, y, w, h]
  trigger_rect?: number[] // Optional sub-highlight
  text: string
  category: string
  type: string
  reason?: string
  sentiment?: string
  page_width: number
  page_height: number
}

interface InteractivePDFViewerProps {
  fileUrl: string
  fileName?: string
  highlights?: Highlight[]
}

const CATEGORY_CONFIG: Record<string, { color: string, hover: string, label: string, icon: any }> = {
  'critical_efficacy': { 
    color: 'rgba(239, 68, 68, 0.25)', 
    hover: 'rgba(239, 68, 68, 0.4)', 
    label: 'Critical Efficacy',
    icon: Activity
  },
  'safety_alert': { 
    color: 'rgba(220, 38, 38, 0.25)', // Darker Red
    hover: 'rgba(220, 38, 38, 0.4)', 
    label: 'Safety Alert',
    icon: AlertTriangle
  },
  'clinical_design': { 
    color: 'rgba(249, 115, 22, 0.25)', // Orange
    hover: 'rgba(249, 115, 22, 0.4)', 
    label: 'Study Design',
    icon: Info
  },
  'cmc_quality': { 
    color: 'rgba(234, 179, 8, 0.25)', // Yellow
    hover: 'rgba(234, 179, 8, 0.4)', 
    label: 'CMC / Quality',
    icon: Info
  },
  'labeling_negotiation': { 
    color: 'rgba(147, 51, 234, 0.25)', // Purple
    hover: 'rgba(147, 51, 234, 0.4)', 
    label: 'Labeling',
    icon: Info
  },
  'approval_strength': { 
    color: 'rgba(34, 197, 94, 0.25)', // Green
    hover: 'rgba(34, 197, 94, 0.4)', 
    label: 'Approval Strength',
    icon: CheckCircle
  },
  'mitigating_factor': { 
    color: 'rgba(14, 165, 233, 0.25)', // Sky Blue
    hover: 'rgba(14, 165, 233, 0.4)', 
    label: 'Mitigating Factor',
    icon: CheckCircle
  },
  'other': { 
    color: 'rgba(107, 114, 128, 0.25)', 
    hover: 'rgba(107, 114, 128, 0.4)', 
    label: 'Other',
    icon: Info
  }
}

const SENTIMENT_LABELS: Record<string, { label: string, color: string }> = {
  'critical_risk': { label: 'CRITICAL RISK', color: 'bg-red-100 text-red-800' },
  'high_risk': { label: 'HIGH RISK', color: 'bg-red-50 text-red-700' },
  'major_concern': { label: 'MAJOR CONCERN', color: 'bg-orange-100 text-orange-800' },
  'moderate_risk': { label: 'MODERATE RISK', color: 'bg-yellow-100 text-yellow-800' },
  'moderate_concern': { label: 'NEGOTIATION', color: 'bg-purple-100 text-purple-800' },
  'strong_positive': { label: 'STRONG POSITIVE', color: 'bg-green-100 text-green-800' },
  'tentative_positive': { label: 'SUPPORTIVE', color: 'bg-blue-100 text-blue-800' }
}

export default function InteractivePDFViewer({ fileUrl, fileName, highlights = [] }: InteractivePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState(1.2)
  const [showHighlights, setShowHighlights] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Group highlights by page for easier rendering
  const highlightsByPage = useMemo(() => {
    const grouped: Record<number, Highlight[]> = {}
    highlights.forEach((h, index) => {
      // Add global index to highlight object for syncing
      const hWithIndex = { ...h, globalIndex: index }
      if (!grouped[h.page]) grouped[h.page] = []
      grouped[h.page].push(hWithIndex)
    })
    return grouped
  }, [highlights])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const zoomIn = () => setScale(Math.min(3.0, scale + 0.25))
  const zoomOut = () => setScale(Math.max(0.5, scale - 0.25))

  const scrollToHighlight = (pageIndex: number) => {
    const element = document.getElementById(`page_${pageIndex}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <Tooltip.Provider delayDuration={0}>
      <div className="grid grid-cols-2 h-full bg-gray-100 overflow-hidden">
        
        {/* LEFT PANE: PDF Viewer */}
        <div className="flex flex-col min-w-0 h-full border-r border-gray-200 bg-slate-50/50">
          {/* Toolbar */}
          <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              {/* Zoom */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={zoomOut} className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all" title="Zoom Out">
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono w-8 text-center text-gray-500">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all" title="Zoom In">
                  <ZoomIn size={16} />
                </button>
              </div>
              
              {/* Toggle */}
              <button 
                onClick={() => setShowHighlights(!showHighlights)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                  showHighlights 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {showHighlights ? <Eye size={14} /> : <EyeOff size={14} />}
                {showHighlights ? 'Analysis Active' : 'Raw Document'}
              </button>
            </div>

            <a
              href={fileUrl}
              download={fileName || 'document.pdf'}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              title="Download Original"
            >
              <Download size={20} />
            </a>
          </div>

          {/* PDF Canvas */}
          <div className="h-full overflow-y-auto p-8 bg-slate-100/50 relative">
            <Document
              file={fileUrl}
              onLoadSuccess={(pdf) => {
                console.log(`PDF Loaded: ${pdf.numPages} pages`)
                setNumPages(pdf.numPages)
              }}
              loading={
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Rendering PDF...</p>
                </div>
              }
              className="flex flex-col items-center gap-8 pb-20" 
            >
              {Array.from(new Array(numPages), (el, index) => {
                const pageNum = index + 1
                const pageHighlights = highlightsByPage[pageNum] || []
                const pageWidth = pageHighlights[0]?.page_width || 612
                const pageHeight = pageHighlights[0]?.page_height || 792

                return (
                  <div key={`page_${pageNum}`} id={`page_${pageNum}`} className="relative shadow-xl rounded-sm overflow-hidden group">
                    <Page
                      pageNumber={pageNum}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="bg-white"
                    />
                    
                    {/* Highlights Overlay */}
                    {showHighlights && pageHighlights.length > 0 && (
                      <svg 
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                        style={{ zIndex: 10 }}
                      >
                        {pageHighlights.map((h: any, i) => {
                          const config = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG['other']
                          const isHovered = hoveredIndex === h.globalIndex
                          
                          return (
                            <Tooltip.Root key={i} open={isHovered}>
                              <Tooltip.Trigger asChild>
                                <g className="cursor-help pointer-events-auto">
                                  {/* Context Highlight */}
                                  <rect
                                    x={h.rect[0] - (isHovered ? 5 : 0)}
                                    y={h.rect[1] - (isHovered ? 2 : 0)}
                                    width={h.rect[2] + (isHovered ? 10 : 0)}
                                    height={h.rect[3] + (isHovered ? 4 : 0)}
                                    rx={4}
                                    fill={config.color}
                                    className={`transition-all duration-300 ease-out ${isHovered ? 'opacity-100' : 'opacity-80'}`}
                                    style={{ mixBlendMode: 'multiply' }}
                                    onMouseEnter={() => setHoveredIndex(h.globalIndex)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                  />
                                  
                                  {/* Trigger Word Sub-Highlight */}
                                  {h.trigger_rect && (
                                    <rect
                                      x={h.trigger_rect[0]} 
                                      y={h.trigger_rect[1]} 
                                      width={h.trigger_rect[2]} 
                                      height={h.trigger_rect[3]}
                                      rx={2} 
                                      fill="transparent" 
                                      stroke={config.hover.replace('0.4', '1')} 
                                      strokeWidth={isHovered ? 3 : 2}
                                      className="animate-pulse"
                                    />
                                  )}
                                  
                                  {/* Connecting Line (Simulated) */}
                                  {isHovered && (
                                     <line 
                                       x1={h.rect[0] + h.rect[2]} 
                                       y1={h.rect[1] + h.rect[3]/2} 
                                       x2={pageWidth} 
                                       y2={h.rect[1] + h.rect[3]/2} 
                                       stroke={config.hover.replace('0.4', '1')} 
                                       strokeWidth={2} 
                                       strokeDasharray="4"
                                       className="animate-in fade-in"
                                     />
                                  )}
                                </g>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  className="bg-gray-900 text-white p-3 rounded shadow-xl text-xs max-w-xs z-50"
                                  sideOffset={5}
                                >
                                  <p>{h.reason}</p>
                                  <Tooltip.Arrow className="fill-gray-900" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          )
                        })}
                      </svg>
                    )}
                  </div>
                )
              })}
            </Document>
          </div>
        </div>

        {/* RIGHT PANE: Insight Cards */}
        <div className="flex flex-col h-full bg-slate-50 border-l border-white shadow-2xl z-30">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity size={24} />
              </div>
              Analysis Findings
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
               {Object.values(CATEGORY_CONFIG).slice(0, 4).map((c, i) => (
                 <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                   <div className="w-2 h-2 rounded-full" style={{ background: c.hover.replace('0.4', '1') }}></div>
                   {c.label}
                 </span>
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {highlights.map((h, i) => {
               const config = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG['other']
               const sentiment = SENTIMENT_LABELS[h.sentiment || ''] || { label: 'INFO', color: 'bg-gray-100 text-gray-800' }
               const isHovered = hoveredIndex === i
               
               return (
                 <div 
                   key={i} 
                   className={`relative group transition-all duration-300 cursor-pointer ${
                     isHovered ? 'scale-[1.02] -translate-x-1' : ''
                   }`}
                   onMouseEnter={() => setHoveredIndex(i)}
                   onMouseLeave={() => setHoveredIndex(null)}
                   onClick={() => scrollToHighlight(h.page)}
                 >
                   {/* Card */}
                   <div className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${
                     isHovered 
                       ? 'border-blue-400 shadow-md ring-4 ring-blue-50' 
                       : 'border-gray-200 hover:border-gray-300'
                   }`}>
                     
                     {/* Header */}
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-md ${sentiment.color.replace('text-', 'bg-opacity-20 ')}`}>
                           <config.icon size={16} className={sentiment.color.split(' ')[1]} />
                         </div>
                         <div>
                           <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{config.label}</div>
                           <div className={`text-[10px] font-bold mt-0.5 ${sentiment.color.split(' ')[1]}`}>{sentiment.label}</div>
                         </div>
                       </div>
                       <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">Page {h.page}</span>
                     </div>

                     {/* Body */}
                     <p className="text-sm text-gray-700 leading-relaxed font-medium line-clamp-4">
                       "{h.text}"
                     </p>
                     
                     {/* Footer / Context */}
                     <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                       <span className="text-xs text-gray-500">{(h.reason || "").split('**')[1] || "Deficiency Detected"}</span>
                     </div>
                   </div>
                   
                   {/* Left Border Accent */}
                   <div 
                     className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-colors"
                     style={{ background: config.hover.replace('0.4', '1') }}
                   ></div>
                 </div>
               )
            })}
            
            {highlights.length === 0 && (
               <div className="text-center py-20 opacity-50">
                 <p>No signals detected.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  )
}