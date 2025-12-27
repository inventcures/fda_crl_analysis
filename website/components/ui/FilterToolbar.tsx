'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Check, Filter, RotateCcw } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import { useDashboardURL } from '@/lib/useDashboardURL'

interface FilterChipProps {
  label: string
  onRemove: () => void
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
    >
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  )
}

interface FilterToolbarProps {
  showYearRange?: boolean
  showCategories?: boolean
  showTherapeuticAreas?: boolean
  showApproval?: boolean
  showAppTypes?: boolean
  categoryLabels?: Record<string, string>
  className?: string
}

export default function FilterToolbar({
  showYearRange = true,
  showCategories = true,
  showTherapeuticAreas = true,
  showApproval = true,
  showAppTypes = true,
  categoryLabels = {},
  className = '',
}: FilterToolbarProps) {
  const { state, actions } = useDashboard()
  const { updateURL, hasFilters, copyURLToClipboard } = useDashboardURL()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // Sync current state to URL first
    updateURL({
      yearRange: state.yearRange,
      categories: state.selectedCategories,
      therapeuticAreas: state.selectedTherapeuticAreas,
      approval: state.approvalFilter,
      appTypes: state.selectedAppTypes,
    }, true)

    // Copy to clipboard
    setTimeout(async () => {
      const success = await copyURLToClipboard()
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }, 100)
  }

  const handleReset = () => {
    actions.resetFilters()
    updateURL({
      yearRange: null,
      categories: [],
      therapeuticAreas: [],
      approval: 'all',
      appTypes: [],
    }, true)
  }

  const activeFilters: { key: string; label: string; onRemove: () => void }[] = []

  // Collect active filters
  if (showYearRange && state.yearRange[0] !== 2020 || state.yearRange[1] !== 2025) {
    activeFilters.push({
      key: 'years',
      label: `${state.yearRange[0]}-${state.yearRange[1]}`,
      onRemove: () => actions.setYearRange([2020, 2025]),
    })
  }

  if (showCategories && state.selectedCategories.length > 0) {
    state.selectedCategories.forEach(cat => {
      activeFilters.push({
        key: `cat-${cat}`,
        label: categoryLabels[cat] || cat,
        onRemove: () => actions.toggleCategory(cat),
      })
    })
  }

  if (showTherapeuticAreas && state.selectedTherapeuticAreas.length > 0) {
    state.selectedTherapeuticAreas.forEach(area => {
      activeFilters.push({
        key: `area-${area}`,
        label: area,
        onRemove: () => actions.toggleTherapeuticArea(area),
      })
    })
  }

  if (showApproval && state.approvalFilter !== 'all') {
    activeFilters.push({
      key: 'approval',
      label: state.approvalFilter === 'approved' ? 'Approved Only' : 'Unapproved Only',
      onRemove: () => actions.setApprovalFilter('all'),
    })
  }

  if (showAppTypes && state.selectedAppTypes.length > 0 && state.selectedAppTypes.length < 3) {
    state.selectedAppTypes.forEach(type => {
      activeFilters.push({
        key: `type-${type}`,
        label: type,
        onRemove: () => actions.toggleAppType(type),
      })
    })
  }

  const hasActiveFilters = activeFilters.length > 0 || state.highlightedCategory

  if (!hasActiveFilters) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Active filters:
          </span>

          <AnimatePresence mode="popLayout">
            {activeFilters.map(filter => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                onRemove={filter.onRemove}
              />
            ))}

            {state.highlightedCategory && (
              <FilterChip
                key="highlight"
                label={`Highlighted: ${categoryLabels[state.highlightedCategory] || state.highlightedCategory}`}
                onRemove={() => actions.setHighlightedCategory(null)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Compact version for inline use
export function ActiveFiltersBadge() {
  const { state } = useDashboard()

  const count =
    state.selectedCategories.length +
    state.selectedTherapeuticAreas.length +
    (state.approvalFilter !== 'all' ? 1 : 0) +
    (state.highlightedCategory ? 1 : 0)

  if (count === 0) return null

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
      {count}
    </span>
  )
}
