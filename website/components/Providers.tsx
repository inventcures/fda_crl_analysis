'use client'

import { ReactNode } from 'react'
import { DashboardProvider } from '@/contexts/DashboardContext'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <DashboardProvider>
      {children}
    </DashboardProvider>
  )
}
