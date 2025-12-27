/**
 * Global Animation System for FDA CRL Analysis Dashboards
 *
 * Provides consistent animation configs for Framer Motion, Recharts, and utilities.
 * Respects prefers-reduced-motion accessibility preference.
 */

import { Variants, Transition } from 'framer-motion'

// ============================================
// Spring Configurations
// ============================================

export const springConfig = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 20 },
  snappy: { tension: 300, friction: 30 },
  bouncy: { tension: 200, friction: 15 },
}

// ============================================
// Framer Motion Variants
// ============================================

// Fade in from below
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// Fade in with scale
export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

// Staggered children animation
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

// For individual staggered items
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// Card entry animation
export const cardEntry: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', ...springConfig.gentle }
  },
}

// Chart container animation
export const chartContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
}

// Slide in from side
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

// ============================================
// Transition Presets
// ============================================

export const transitions = {
  fast: { duration: 0.2, ease: 'easeOut' } as Transition,
  default: { duration: 0.3, ease: 'easeOut' } as Transition,
  slow: { duration: 0.5, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', ...springConfig.default } as Transition,
  springGentle: { type: 'spring', ...springConfig.gentle } as Transition,
}

// ============================================
// Recharts Animation Config
// ============================================

export const rechartsAnimationConfig = {
  isAnimationActive: true,
  animationDuration: 800,
  animationEasing: 'ease-out' as const,
  animationBegin: 0,
}

// For staggered bar animations
export const getBarAnimationDelay = (index: number, baseDelay = 0): number => {
  return baseDelay + index * 50 // 50ms stagger between bars
}

// Line chart draw animation
export const lineAnimationConfig = {
  isAnimationActive: true,
  animationDuration: 1200,
  animationEasing: 'ease-out' as const,
}

// ============================================
// CSS Animation Classes
// ============================================

export const animationClasses = {
  // Hover lift effect
  hoverLift: 'transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg',

  // Hover scale effect
  hoverScale: 'transition-transform duration-200 hover:scale-105',

  // Pulse on hover
  hoverPulse: 'transition-opacity duration-200 hover:opacity-80',

  // Selection dimming for unselected items
  dimmed: 'opacity-40 transition-opacity duration-200',

  // Highlight pulse
  highlightPulse: 'animate-pulse',

  // Shimmer loading effect
  shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation config respecting reduced motion preference
 */
export const getAnimationConfig = () => {
  if (prefersReducedMotion()) {
    return {
      ...rechartsAnimationConfig,
      isAnimationActive: false,
      animationDuration: 0,
    }
  }
  return rechartsAnimationConfig
}

/**
 * Get Framer Motion transition respecting reduced motion
 */
export const getTransition = (preset: keyof typeof transitions = 'default'): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0 }
  }
  return transitions[preset]
}

/**
 * Generate staggered delay for list items
 */
export const getStaggerDelay = (index: number, baseDelay = 0, stagger = 0.05): number => {
  if (prefersReducedMotion()) return 0
  return baseDelay + index * stagger
}

// ============================================
// CountUp Animation Helpers
// ============================================

export interface CountUpConfig {
  start?: number
  end: number
  duration?: number
  decimals?: number
  separator?: string
  prefix?: string
  suffix?: string
}

export const defaultCountUpConfig: Partial<CountUpConfig> = {
  start: 0,
  duration: 1.5,
  decimals: 0,
  separator: ',',
}

/**
 * Get CountUp config respecting reduced motion
 */
export const getCountUpConfig = (config: CountUpConfig): CountUpConfig => {
  if (prefersReducedMotion()) {
    return { ...config, duration: 0 }
  }
  return { ...defaultCountUpConfig, ...config }
}

// ============================================
// Skeleton Loader Dimensions
// ============================================

export const skeletonDimensions = {
  statCard: { width: '100%', height: '120px' },
  barChart: { width: '100%', height: '300px' },
  lineChart: { width: '100%', height: '250px' },
  radarChart: { width: '100%', height: '300px' },
  heatmap: { width: '100%', height: '400px' },
  wordCloud: { width: '100%', height: '300px' },
}

// ============================================
// Chart Color Transitions
// ============================================

export const chartColors = {
  // Base colors with hover states
  approved: {
    base: '#10b981',
    hover: '#059669',
    dim: '#10b98140',
  },
  unapproved: {
    base: '#6b7280',
    hover: '#4b5563',
    dim: '#6b728040',
  },
  highlight: {
    base: '#3b82f6',
    hover: '#2563eb',
    dim: '#3b82f640',
  },
  warning: {
    base: '#f59e0b',
    hover: '#d97706',
    dim: '#f59e0b40',
  },
  danger: {
    base: '#ef4444',
    hover: '#dc2626',
    dim: '#ef444440',
  },
}

/**
 * Get color with appropriate state
 */
export const getChartColor = (
  colorKey: keyof typeof chartColors,
  state: 'base' | 'hover' | 'dim' = 'base'
): string => {
  return chartColors[colorKey][state]
}
