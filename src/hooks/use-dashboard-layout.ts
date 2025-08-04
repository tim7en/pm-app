"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getDashboardLayout, 
  saveDashboardLayout,
  updateWidgetLayout,
  toggleWidgetVisibility,
  reorderWidgets,
  getVisibleWidgets,
  type DashboardLayout,
  type DashboardWidget 
} from "@/lib/dashboard-layout-storage"

export interface UseDashboardLayoutReturn {
  layout: DashboardLayout
  visibleWidgets: DashboardWidget[]
  isLoading: boolean
  updateLayout: (newLayout: DashboardLayout) => void
  updateWidgetPosition: (widgetId: string, position: { x: number; y: number }, size?: { width: number; height: number }) => void
  toggleWidget: (widgetId: string) => void
  reorderWidgetList: (widgetIds: string[]) => void
  refreshLayout: () => void
}

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [visibleWidgets, setVisibleWidgets] = useState<DashboardWidget[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize layout from localStorage
  useEffect(() => {
    const initializeLayout = () => {
      try {
        const savedLayout = getDashboardLayout()
        setLayout(savedLayout)
        setVisibleWidgets(getVisibleWidgets())
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize dashboard layout:', error)
        setIsLoading(false)
      }
    }

    initializeLayout()
  }, [])

  const updateLayout = useCallback((newLayout: DashboardLayout) => {
    setLayout(newLayout)
    saveDashboardLayout(newLayout)
    setVisibleWidgets(getVisibleWidgets())
  }, [])

  const updateWidgetPosition = useCallback((
    widgetId: string, 
    position: { x: number; y: number }, 
    size?: { width: number; height: number }
  ) => {
    updateWidgetLayout(widgetId, position, size)
    const updatedLayout = getDashboardLayout()
    setLayout(updatedLayout)
    setVisibleWidgets(getVisibleWidgets())
  }, [])

  const toggleWidget = useCallback((widgetId: string) => {
    toggleWidgetVisibility(widgetId)
    const updatedLayout = getDashboardLayout()
    setLayout(updatedLayout)
    setVisibleWidgets(getVisibleWidgets())
  }, [])

  const reorderWidgetList = useCallback((widgetIds: string[]) => {
    reorderWidgets(widgetIds)
    const updatedLayout = getDashboardLayout()
    setLayout(updatedLayout)
    setVisibleWidgets(getVisibleWidgets())
  }, [])

  const refreshLayout = useCallback(() => {
    const currentLayout = getDashboardLayout()
    setLayout(currentLayout)
    setVisibleWidgets(getVisibleWidgets())
  }, [])

  return {
    layout: layout || getDashboardLayout(),
    visibleWidgets,
    isLoading,
    updateLayout,
    updateWidgetPosition,
    toggleWidget,
    reorderWidgetList,
    refreshLayout
  }
}
