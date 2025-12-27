'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDashboardOptional } from '@/contexts/DashboardContext'

// ============================================
// URL Parameter Parsing Utilities
// ============================================

function parseRange(value: string | null): [number, number] | null {
  if (!value) return null
  const parts = value.split('-').map(Number)
  if (parts.length !== 2 || parts.some(isNaN)) return null
  return [parts[0], parts[1]]
}

function parseArray(value: string | null): string[] {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

function parseApproval(value: string | null): 'all' | 'approved' | 'unapproved' {
  if (value === 'approved' || value === 'unapproved') return value
  return 'all'
}

// ============================================
// URL State Interface
// ============================================

export interface URLState {
  yearRange: [number, number] | null
  categories: string[]
  therapeuticAreas: string[]
  approval: 'all' | 'approved' | 'unapproved'
  appTypes: string[]
  highlightedCategory: string | null
  highlightedYear: string | null
}

// ============================================
// Hook
// ============================================

export function useDashboardURL() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dashboardContext = useDashboardOptional()

  // Parse current URL state
  const urlState = useMemo((): URLState => ({
    yearRange: parseRange(searchParams.get('years')),
    categories: parseArray(searchParams.get('cats')),
    therapeuticAreas: parseArray(searchParams.get('areas')),
    approval: parseApproval(searchParams.get('approval')),
    appTypes: parseArray(searchParams.get('types')),
    highlightedCategory: searchParams.get('highlight') || null,
    highlightedYear: searchParams.get('year') || null,
  }), [searchParams])

  // Sync URL to dashboard state on mount/URL change
  useEffect(() => {
    if (!dashboardContext) return

    const { actions, state } = dashboardContext

    // Only sync if URL has values
    if (urlState.yearRange) {
      actions.setYearRange(urlState.yearRange)
    }
    if (urlState.categories.length > 0) {
      actions.setSelectedCategories(urlState.categories)
    }
    if (urlState.therapeuticAreas.length > 0) {
      actions.setTherapeuticAreas(urlState.therapeuticAreas)
    }
    if (urlState.approval !== 'all') {
      actions.setApprovalFilter(urlState.approval)
    }
    if (urlState.appTypes.length > 0) {
      actions.setAppTypes(urlState.appTypes)
    }
    if (urlState.highlightedCategory) {
      actions.setHighlightedCategory(urlState.highlightedCategory)
    }
    if (urlState.highlightedYear) {
      actions.setHighlightedYear(urlState.highlightedYear)
    }
  }, []) // Only run on mount

  // Update URL with new state
  const updateURL = useCallback((newState: Partial<URLState>, replace = false) => {
    const params = new URLSearchParams(searchParams.toString())

    // Year range
    if (newState.yearRange !== undefined) {
      if (newState.yearRange) {
        params.set('years', newState.yearRange.join('-'))
      } else {
        params.delete('years')
      }
    }

    // Categories
    if (newState.categories !== undefined) {
      if (newState.categories.length > 0) {
        params.set('cats', newState.categories.join(','))
      } else {
        params.delete('cats')
      }
    }

    // Therapeutic areas
    if (newState.therapeuticAreas !== undefined) {
      if (newState.therapeuticAreas.length > 0) {
        params.set('areas', newState.therapeuticAreas.join(','))
      } else {
        params.delete('areas')
      }
    }

    // Approval filter
    if (newState.approval !== undefined) {
      if (newState.approval !== 'all') {
        params.set('approval', newState.approval)
      } else {
        params.delete('approval')
      }
    }

    // App types
    if (newState.appTypes !== undefined) {
      if (newState.appTypes.length > 0) {
        params.set('types', newState.appTypes.join(','))
      } else {
        params.delete('types')
      }
    }

    // Highlighted category
    if (newState.highlightedCategory !== undefined) {
      if (newState.highlightedCategory) {
        params.set('highlight', newState.highlightedCategory)
      } else {
        params.delete('highlight')
      }
    }

    // Highlighted year
    if (newState.highlightedYear !== undefined) {
      if (newState.highlightedYear) {
        params.set('year', newState.highlightedYear)
      } else {
        params.delete('year')
      }
    }

    const queryString = params.toString()
    const newURL = queryString ? `${pathname}?${queryString}` : pathname

    if (replace) {
      router.replace(newURL, { scroll: false })
    } else {
      router.push(newURL, { scroll: false })
    }
  }, [searchParams, pathname, router])

  // Clear all URL params
  const clearURL = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  // Get shareable URL
  const getShareableURL = useCallback((): string => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  // Copy URL to clipboard
  const copyURLToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getShareableURL())
      return true
    } catch {
      return false
    }
  }, [getShareableURL])

  return {
    urlState,
    updateURL,
    clearURL,
    getShareableURL,
    copyURLToClipboard,
    hasFilters: Object.values(urlState).some(v =>
      v !== null && v !== 'all' && (Array.isArray(v) ? v.length > 0 : true)
    ),
  }
}

// ============================================
// Share Button Component Helper
// ============================================

export interface ShareState {
  isShared: boolean
  setIsShared: (value: boolean) => void
}

export function useShareButton() {
  const { copyURLToClipboard, hasFilters } = useDashboardURL()

  const share = useCallback(async () => {
    const success = await copyURLToClipboard()
    return success
  }, [copyURLToClipboard])

  return { share, hasFilters }
}
