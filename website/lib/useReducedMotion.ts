'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect user's preference for reduced motion.
 * Returns true if the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Get Recharts animation config based on reduced motion preference
 */
export function useChartAnimationConfig() {
  const reducedMotion = useReducedMotion()

  return {
    isAnimationActive: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 800,
    animationEasing: 'ease-out' as const,
  }
}

/**
 * Get Framer Motion animation props based on reduced motion preference
 */
export function useMotionProps() {
  const reducedMotion = useReducedMotion()

  return {
    // For initial/animate props
    initialProps: reducedMotion ? {} : { opacity: 0, y: 20 },
    animateProps: reducedMotion ? {} : { opacity: 1, y: 0 },

    // Transition config
    transition: reducedMotion
      ? { duration: 0 }
      : { duration: 0.3, ease: 'easeOut' },

    // Hover animations
    whileHover: reducedMotion ? {} : { scale: 1.02 },
    whileTap: reducedMotion ? {} : { scale: 0.98 },
  }
}
