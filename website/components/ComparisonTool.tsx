'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import {
  Search,
  X,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scale,
  Layers,
  Eye,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

// Types
interface CRLDocument {
  file_hash: string
  drug_name: string
  application_number: string
  application_type: string
  approval_status: 'approved' | 'unapproved'
  deficiency_categories: string[]
  therapeutic_area: string
  letter_date: string
  page_count: number
  has_safety_concerns: boolean
  has_efficacy_concerns: boolean
  has_cmc_issues: boolean
  requests_new_trial: boolean
}

interface ComparisonSlot {
  id: number
  document: CRLDocument | null
}

// Color palette for comparison
const COMPARISON_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
]

const CATEGORY_LABELS: Record<string, string> = {
  labeling: 'Labeling',
  safety: 'Safety',
  cmc_manufacturing: 'CMC/Manufacturing',
  efficacy: 'Efficacy',
  statistical: 'Statistical',
  clinical_trial_design: 'Clinical Trial Design',
  bioequivalence: 'Bioequivalence',
  rems: 'REMS',
}

// Search component
function DocumentSearch({
  documents,
  onSelect,
  excludeHashes,
  placeholder
}: {
  documents: CRLDocument[]
  onSelect: (doc: CRLDocument) => void
  excludeHashes: string[]
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredDocs = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return documents
      .filter(doc => !excludeHashes.includes(doc.file_hash))
      .filter(doc =>
        doc.drug_name?.toLowerCase().includes(q) ||
        doc.application_number?.toLowerCase().includes(q) ||
        doc.therapeutic_area?.toLowerCase().includes(q)
      )
      .slice(0, 10)
  }, [documents, query, excludeHashes])

  const handleSelect = (doc: CRLDocument) => {
    onSelect(doc)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <AnimatePresence>
        {isOpen && filteredDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-auto"
          >
            {filteredDocs.map(doc => (
              <div
                key={doc.file_hash}
                onClick={() => handleSelect(doc)}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {doc.drug_name || doc.application_number}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    doc.approval_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {doc.approval_status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {doc.application_type} • {doc.therapeutic_area} • {doc.letter_date}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Document card component
function DocumentCard({
  document,
  color,
  index,
  onRemove,
  onView
}: {
  document: CRLDocument
  color: string
  index: number
  onRemove: () => void
  onView: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border-2 p-4"
      style={{ borderColor: color }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: color }}
          >
            {index + 1}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {document.drug_name || document.application_number}
            </h4>
            <p className="text-xs text-gray-500">
              {document.application_type} {document.application_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="View document"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Status</span>
          <span className={`flex items-center gap-1 font-medium ${
            document.approval_status === 'approved' ? 'text-emerald-600' : 'text-gray-600'
          }`}>
            {document.approval_status === 'approved'
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <XCircle className="w-3.5 h-3.5" />
            }
            {document.approval_status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Therapeutic Area</span>
          <span className="font-medium text-gray-900">{document.therapeutic_area}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Letter Date</span>
          <span className="font-medium text-gray-900">{document.letter_date}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Page Count</span>
          <span className="font-medium text-gray-900">{document.page_count}</span>
        </div>
      </div>

      {/* Deficiency categories */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Deficiency Categories:</p>
        <div className="flex flex-wrap gap-1">
          {document.deficiency_categories.map(cat => (
            <span
              key={cat}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {CATEGORY_LABELS[cat] || cat}
            </span>
          ))}
        </div>
      </div>

      {/* Flags */}
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
        <FlagIndicator label="Safety" active={document.has_safety_concerns} />
        <FlagIndicator label="Efficacy" active={document.has_efficacy_concerns} />
        <FlagIndicator label="CMC" active={document.has_cmc_issues} />
        <FlagIndicator label="New Trial" active={document.requests_new_trial} />
      </div>
    </motion.div>
  )
}

// Flag indicator component
function FlagIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${active ? 'text-amber-600' : 'text-gray-400'}`}>
      {active ? <AlertTriangle className="w-3 h-3" /> : <span className="w-3 h-3" />}
      {label}
    </div>
  )
}

// Empty slot component
function EmptySlot({
  documents,
  excludeHashes,
  onSelect
}: {
  documents: CRLDocument[]
  excludeHashes: string[]
  onSelect: (doc: CRLDocument) => void
}) {
  return (
    <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-4 min-h-[300px] flex flex-col items-center justify-center">
      <Plus className="w-8 h-8 text-gray-300 mb-3" />
      <p className="text-sm text-gray-500 mb-3">Add a CRL to compare</p>
      <div className="w-full">
        <DocumentSearch
          documents={documents}
          onSelect={onSelect}
          excludeHashes={excludeHashes}
          placeholder="Search by drug name..."
        />
      </div>
    </div>
  )
}

// Radar comparison chart
function RadarComparison({
  slots,
  allCategories
}: {
  slots: ComparisonSlot[]
  allCategories: string[]
}) {
  const activeSlots = slots.filter(s => s.document !== null)

  if (activeSlots.length < 2) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
        Select at least 2 CRLs to see radar comparison
      </div>
    )
  }

  // Build radar data
  const radarData = allCategories.map(cat => {
    const point: Record<string, any> = {
      category: CATEGORY_LABELS[cat] || cat,
      fullMark: 1,
    }
    activeSlots.forEach((slot, i) => {
      if (slot.document) {
        point[`doc${i}`] = slot.document.deficiency_categories.includes(cat) ? 1 : 0
      }
    })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 1]}
          tick={false}
          axisLine={false}
        />
        {activeSlots.map((slot, i) => (
          <Radar
            key={slot.id}
            name={slot.document?.drug_name || `Document ${i + 1}`}
            dataKey={`doc${i}`}
            stroke={COMPARISON_COLORS[i]}
            fill={COMPARISON_COLORS[i]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// Category comparison bar chart
function CategoryComparison({
  slots,
  allCategories
}: {
  slots: ComparisonSlot[]
  allCategories: string[]
}) {
  const activeSlots = slots.filter(s => s.document !== null)

  if (activeSlots.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        Select CRLs to see category comparison
      </div>
    )
  }

  // Build bar data - count categories per document
  const barData = activeSlots.map((slot, i) => ({
    name: slot.document?.drug_name || `Document ${i + 1}`,
    categories: slot.document?.deficiency_categories.length || 0,
    color: COMPARISON_COLORS[i],
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          width={100}
          tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-white shadow-lg rounded-lg p-2 border text-sm">
                <p className="font-medium">{payload[0].payload.name}</p>
                <p className="text-gray-600">{payload[0].value} deficiency categories</p>
              </div>
            )
          }}
        />
        <Bar dataKey="categories" radius={[0, 4, 4, 0]}>
          {barData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Similarity score calculation
function calculateSimilarity(doc1: CRLDocument, doc2: CRLDocument): number {
  const cats1 = new Set(doc1.deficiency_categories)
  const cats2 = new Set(doc2.deficiency_categories)

  const intersection = new Set([...cats1].filter(x => cats2.has(x)))
  const union = new Set([...cats1, ...cats2])

  if (union.size === 0) return 0
  return (intersection.size / union.size) * 100
}

// Similarity matrix
function SimilarityMatrix({ slots }: { slots: ComparisonSlot[] }) {
  const activeSlots = slots.filter(s => s.document !== null)

  if (activeSlots.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        Select at least 2 CRLs to see similarity matrix
      </div>
    )
  }

  const matrix = activeSlots.map((slot1, i) =>
    activeSlots.map((slot2, j) => {
      if (i === j) return 100
      if (!slot1.document || !slot2.document) return 0
      return calculateSimilarity(slot1.document, slot2.document)
    })
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2"></th>
            {activeSlots.map((slot, i) => (
              <th key={slot.id} className="p-2 text-center">
                <div
                  className="w-6 h-6 rounded-full mx-auto flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: COMPARISON_COLORS[i] }}
                >
                  {i + 1}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeSlots.map((slot, i) => (
            <tr key={slot.id}>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: COMPARISON_COLORS[i] }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-gray-600 truncate max-w-20">
                    {slot.document?.drug_name || '-'}
                  </span>
                </div>
              </td>
              {matrix[i].map((similarity, j) => (
                <td key={j} className="p-2 text-center">
                  <div
                    className={`w-12 h-8 mx-auto rounded flex items-center justify-center text-xs font-medium ${
                      i === j
                        ? 'bg-gray-100 text-gray-400'
                        : similarity >= 70
                          ? 'bg-emerald-100 text-emerald-700'
                          : similarity >= 40
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {i === j ? '-' : `${similarity.toFixed(0)}%`}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Main component
export default function ComparisonTool() {
  const [documents, setDocuments] = useState<CRLDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<ComparisonSlot[]>([
    { id: 1, document: null },
    { id: 2, document: null },
  ])

  // Load data
  useEffect(() => {
    fetch('/data/enriched_crls.json')
      .then(res => res.json())
      .then((data: CRLDocument[]) => {
        setDocuments(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load CRL data:', err)
        setLoading(false)
      })
  }, [])

  // All deficiency categories from loaded documents
  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    documents.forEach(doc => {
      doc.deficiency_categories.forEach(cat => cats.add(cat))
    })
    return Array.from(cats).sort()
  }, [documents])

  // Get hashes of currently selected documents
  const excludeHashes = useMemo(() => {
    return slots
      .filter(s => s.document !== null)
      .map(s => s.document!.file_hash)
  }, [slots])

  // Handle adding a document to a slot
  const handleAddDocument = useCallback((slotId: number, doc: CRLDocument) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, document: doc } : s
    ))
  }, [])

  // Handle removing a document from a slot
  const handleRemoveDocument = useCallback((slotId: number) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, document: null } : s
    ))
  }, [])

  // Add new comparison slot (max 4)
  const handleAddSlot = useCallback(() => {
    if (slots.length >= 4) return
    const newId = Math.max(...slots.map(s => s.id)) + 1
    setSlots(prev => [...prev, { id: newId, document: null }])
  }, [slots])

  // Remove a slot
  const handleRemoveSlot = useCallback((slotId: number) => {
    if (slots.length <= 2) return
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }, [slots])

  // Clear all
  const handleClearAll = useCallback(() => {
    setSlots([
      { id: 1, document: null },
      { id: 2, document: null },
    ])
  }, [])

  // View document
  const handleViewDocument = useCallback((hash: string) => {
    window.open(`/document-view/${hash}`, '_blank')
  }, [])

  const activeCount = slots.filter(s => s.document !== null).length

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton type="stat" height={80} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartSkeleton type="stat" height={300} />
          <ChartSkeleton type="stat" height={300} />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              CRL Comparison Tool
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Compare up to 4 CRLs side-by-side to identify patterns and differences
            </p>
          </div>
          <div className="flex items-center gap-2">
            {slots.length < 4 && (
              <button
                onClick={handleAddSlot}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            )}
            {activeCount > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Quick search */}
        <div className="max-w-md">
          <p className="text-xs text-gray-500 mb-2">Quick add:</p>
          <DocumentSearch
            documents={documents}
            onSelect={(doc) => {
              // Find first empty slot
              const emptySlot = slots.find(s => s.document === null)
              if (emptySlot) {
                handleAddDocument(emptySlot.id, doc)
              }
            }}
            excludeHashes={excludeHashes}
            placeholder="Search for a CRL to add..."
          />
        </div>
      </div>

      {/* Document slots */}
      <div className={`grid gap-4 ${
        slots.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        slots.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        <AnimatePresence mode="popLayout">
          {slots.map((slot, index) => (
            <motion.div
              key={slot.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {slot.document ? (
                <DocumentCard
                  document={slot.document}
                  color={COMPARISON_COLORS[index]}
                  index={index}
                  onRemove={() => handleRemoveDocument(slot.id)}
                  onView={() => handleViewDocument(slot.document!.file_hash)}
                />
              ) : (
                <EmptySlot
                  documents={documents}
                  excludeHashes={excludeHashes}
                  onSelect={(doc) => handleAddDocument(slot.id, doc)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Comparison charts */}
      {activeCount >= 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Deficiency Profile Overlay
            </h3>
            <RadarComparison slots={slots} allCategories={allCategories} />
          </div>

          {/* Category count comparison */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Deficiency Category Count
            </h3>
            <CategoryComparison slots={slots} allCategories={allCategories} />

            {/* Similarity matrix */}
            {activeCount >= 2 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5" />
                  Deficiency Similarity (Jaccard Index)
                </h4>
                <SimilarityMatrix slots={slots} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Common deficiencies panel */}
      {activeCount >= 2 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            Deficiency Comparison Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 font-medium text-gray-600">Category</th>
                  {slots.filter(s => s.document).map((slot, i) => (
                    <th key={slot.id} className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COMPARISON_COLORS[i] }}
                        />
                        <span className="font-medium text-gray-900 truncate max-w-24">
                          {slot.document?.drug_name || '-'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCategories.map(cat => {
                  const activeSlots = slots.filter(s => s.document)
                  const hasCategory = activeSlots.map(s =>
                    s.document?.deficiency_categories.includes(cat)
                  )
                  const allHave = hasCategory.every(Boolean)
                  const noneHave = hasCategory.every(v => !v)

                  if (noneHave) return null

                  return (
                    <tr
                      key={cat}
                      className={`border-b border-gray-100 ${allHave ? 'bg-amber-50' : ''}`}
                    >
                      <td className="p-2 text-gray-700">
                        {CATEGORY_LABELS[cat] || cat}
                        {allHave && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">
                            Common
                          </span>
                        )}
                      </td>
                      {activeSlots.map((slot, i) => (
                        <td key={slot.id} className="text-center p-2">
                          {slot.document?.deficiency_categories.includes(cat) ? (
                            <CheckCircle
                              className="w-5 h-5 mx-auto"
                              style={{ color: COMPARISON_COLORS[i] }}
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-500" />
          How to Use the Comparison Tool
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">1. Select CRLs</div>
            <p>
              Use the search boxes to find and add CRLs by drug name,
              application number, or therapeutic area.
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">2. Compare Profiles</div>
            <p>
              The radar chart overlays deficiency profiles, making it easy
              to spot common or unique issues.
            </p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">3. Analyze Patterns</div>
            <p>
              The similarity matrix shows how alike the CRLs are based on
              their deficiency categories.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
