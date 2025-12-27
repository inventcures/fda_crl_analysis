'use client'

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'

// ============================================
// State Types
// ============================================

export interface DashboardState {
  // Filters
  yearRange: [number, number]
  selectedCategories: string[]
  selectedTherapeuticAreas: string[]
  approvalFilter: 'all' | 'approved' | 'unapproved'
  selectedAppTypes: string[]

  // Interactions
  hoveredDocument: string | null
  selectedDocuments: string[]
  highlightedCategory: string | null
  highlightedYear: string | null

  // View state
  comparisonMode: boolean
  showAnnotations: boolean
}

// ============================================
// Actions
// ============================================

type DashboardAction =
  | { type: 'SET_YEAR_RANGE'; payload: [number, number] }
  | { type: 'SET_SELECTED_CATEGORIES'; payload: string[] }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'SET_THERAPEUTIC_AREAS'; payload: string[] }
  | { type: 'TOGGLE_THERAPEUTIC_AREA'; payload: string }
  | { type: 'SET_APPROVAL_FILTER'; payload: 'all' | 'approved' | 'unapproved' }
  | { type: 'SET_APP_TYPES'; payload: string[] }
  | { type: 'TOGGLE_APP_TYPE'; payload: string }
  | { type: 'SET_HOVERED_DOCUMENT'; payload: string | null }
  | { type: 'SELECT_DOCUMENT'; payload: string }
  | { type: 'DESELECT_DOCUMENT'; payload: string }
  | { type: 'SET_SELECTED_DOCUMENTS'; payload: string[] }
  | { type: 'CLEAR_SELECTED_DOCUMENTS' }
  | { type: 'SET_HIGHLIGHTED_CATEGORY'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_YEAR'; payload: string | null }
  | { type: 'SET_COMPARISON_MODE'; payload: boolean }
  | { type: 'SET_SHOW_ANNOTATIONS'; payload: boolean }
  | { type: 'RESET_FILTERS' }

// ============================================
// Initial State
// ============================================

const initialState: DashboardState = {
  yearRange: [2020, 2025],
  selectedCategories: [],
  selectedTherapeuticAreas: [],
  approvalFilter: 'all',
  selectedAppTypes: [],
  hoveredDocument: null,
  selectedDocuments: [],
  highlightedCategory: null,
  highlightedYear: null,
  comparisonMode: false,
  showAnnotations: true,
}

// ============================================
// Reducer
// ============================================

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_YEAR_RANGE':
      return { ...state, yearRange: action.payload }

    case 'SET_SELECTED_CATEGORIES':
      return { ...state, selectedCategories: action.payload }

    case 'TOGGLE_CATEGORY': {
      const categories = state.selectedCategories.includes(action.payload)
        ? state.selectedCategories.filter(c => c !== action.payload)
        : [...state.selectedCategories, action.payload]
      return { ...state, selectedCategories: categories }
    }

    case 'SET_THERAPEUTIC_AREAS':
      return { ...state, selectedTherapeuticAreas: action.payload }

    case 'TOGGLE_THERAPEUTIC_AREA': {
      const areas = state.selectedTherapeuticAreas.includes(action.payload)
        ? state.selectedTherapeuticAreas.filter(a => a !== action.payload)
        : [...state.selectedTherapeuticAreas, action.payload]
      return { ...state, selectedTherapeuticAreas: areas }
    }

    case 'SET_APPROVAL_FILTER':
      return { ...state, approvalFilter: action.payload }

    case 'SET_APP_TYPES':
      return { ...state, selectedAppTypes: action.payload }

    case 'TOGGLE_APP_TYPE': {
      const types = state.selectedAppTypes.includes(action.payload)
        ? state.selectedAppTypes.filter(t => t !== action.payload)
        : [...state.selectedAppTypes, action.payload]
      return { ...state, selectedAppTypes: types }
    }

    case 'SET_HOVERED_DOCUMENT':
      return { ...state, hoveredDocument: action.payload }

    case 'SELECT_DOCUMENT':
      if (state.selectedDocuments.includes(action.payload)) return state
      return { ...state, selectedDocuments: [...state.selectedDocuments, action.payload] }

    case 'DESELECT_DOCUMENT':
      return {
        ...state,
        selectedDocuments: state.selectedDocuments.filter(d => d !== action.payload),
      }

    case 'SET_SELECTED_DOCUMENTS':
      return { ...state, selectedDocuments: action.payload }

    case 'CLEAR_SELECTED_DOCUMENTS':
      return { ...state, selectedDocuments: [] }

    case 'SET_HIGHLIGHTED_CATEGORY':
      return { ...state, highlightedCategory: action.payload }

    case 'SET_HIGHLIGHTED_YEAR':
      return { ...state, highlightedYear: action.payload }

    case 'SET_COMPARISON_MODE':
      return { ...state, comparisonMode: action.payload }

    case 'SET_SHOW_ANNOTATIONS':
      return { ...state, showAnnotations: action.payload }

    case 'RESET_FILTERS':
      return {
        ...state,
        yearRange: initialState.yearRange,
        selectedCategories: [],
        selectedTherapeuticAreas: [],
        approvalFilter: 'all',
        selectedAppTypes: [],
        highlightedCategory: null,
        highlightedYear: null,
      }

    default:
      return state
  }
}

// ============================================
// Context
// ============================================

interface DashboardContextValue {
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  actions: {
    setYearRange: (range: [number, number]) => void
    setSelectedCategories: (categories: string[]) => void
    toggleCategory: (category: string) => void
    setTherapeuticAreas: (areas: string[]) => void
    toggleTherapeuticArea: (area: string) => void
    setApprovalFilter: (filter: 'all' | 'approved' | 'unapproved') => void
    setAppTypes: (types: string[]) => void
    toggleAppType: (type: string) => void
    setHoveredDocument: (hash: string | null) => void
    selectDocument: (hash: string) => void
    deselectDocument: (hash: string) => void
    setSelectedDocuments: (hashes: string[]) => void
    clearSelectedDocuments: () => void
    setHighlightedCategory: (category: string | null) => void
    setHighlightedYear: (year: string | null) => void
    setComparisonMode: (enabled: boolean) => void
    setShowAnnotations: (show: boolean) => void
    resetFilters: () => void
  }
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

// ============================================
// Provider
// ============================================

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  const actions = {
    setYearRange: useCallback((range: [number, number]) => {
      dispatch({ type: 'SET_YEAR_RANGE', payload: range })
    }, []),

    setSelectedCategories: useCallback((categories: string[]) => {
      dispatch({ type: 'SET_SELECTED_CATEGORIES', payload: categories })
    }, []),

    toggleCategory: useCallback((category: string) => {
      dispatch({ type: 'TOGGLE_CATEGORY', payload: category })
    }, []),

    setTherapeuticAreas: useCallback((areas: string[]) => {
      dispatch({ type: 'SET_THERAPEUTIC_AREAS', payload: areas })
    }, []),

    toggleTherapeuticArea: useCallback((area: string) => {
      dispatch({ type: 'TOGGLE_THERAPEUTIC_AREA', payload: area })
    }, []),

    setApprovalFilter: useCallback((filter: 'all' | 'approved' | 'unapproved') => {
      dispatch({ type: 'SET_APPROVAL_FILTER', payload: filter })
    }, []),

    setAppTypes: useCallback((types: string[]) => {
      dispatch({ type: 'SET_APP_TYPES', payload: types })
    }, []),

    toggleAppType: useCallback((type: string) => {
      dispatch({ type: 'TOGGLE_APP_TYPE', payload: type })
    }, []),

    setHoveredDocument: useCallback((hash: string | null) => {
      dispatch({ type: 'SET_HOVERED_DOCUMENT', payload: hash })
    }, []),

    selectDocument: useCallback((hash: string) => {
      dispatch({ type: 'SELECT_DOCUMENT', payload: hash })
    }, []),

    deselectDocument: useCallback((hash: string) => {
      dispatch({ type: 'DESELECT_DOCUMENT', payload: hash })
    }, []),

    setSelectedDocuments: useCallback((hashes: string[]) => {
      dispatch({ type: 'SET_SELECTED_DOCUMENTS', payload: hashes })
    }, []),

    clearSelectedDocuments: useCallback(() => {
      dispatch({ type: 'CLEAR_SELECTED_DOCUMENTS' })
    }, []),

    setHighlightedCategory: useCallback((category: string | null) => {
      dispatch({ type: 'SET_HIGHLIGHTED_CATEGORY', payload: category })
    }, []),

    setHighlightedYear: useCallback((year: string | null) => {
      dispatch({ type: 'SET_HIGHLIGHTED_YEAR', payload: year })
    }, []),

    setComparisonMode: useCallback((enabled: boolean) => {
      dispatch({ type: 'SET_COMPARISON_MODE', payload: enabled })
    }, []),

    setShowAnnotations: useCallback((show: boolean) => {
      dispatch({ type: 'SET_SHOW_ANNOTATIONS', payload: show })
    }, []),

    resetFilters: useCallback(() => {
      dispatch({ type: 'RESET_FILTERS' })
    }, []),
  }

  return (
    <DashboardContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </DashboardContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

// Optional: Hook that doesn't throw (for components that may be outside provider)
export function useDashboardOptional() {
  return useContext(DashboardContext)
}
