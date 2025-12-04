'use client'

import { ReactNode } from 'react'
import { ActivityProvider } from '@/components/providers'
import { ToastProvider } from '@/components/ui'

interface Props {
  children: ReactNode
}

export function DashboardClientWrapper({ children }: Props) {
  return (
    <ToastProvider>
      <ActivityProvider>
        {children}
      </ActivityProvider>
    </ToastProvider>
  )
}

