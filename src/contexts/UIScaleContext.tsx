"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSetting, type UIScale } from "@/lib/settings-storage"

interface UIScaleContextType {
  scale: UIScale
  setScale: (scale: UIScale) => void
  scalePercentage: number
  scaleClasses: {
    text: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      "2xl": string
    }
    spacing: {
      card: string
      section: string
      button: string
    }
    layout: {
      sidebar: string
      header: string
    }
  }
}

const UIScaleContext = createContext<UIScaleContextType | undefined>(undefined)

const scaleConfigs = {
  xs: {
    text: {
      xs: "text-[9px]",
      sm: "text-[10px]",
      base: "text-[11px]",
      lg: "text-[12px]",
      xl: "text-[14px]",
      "2xl": "text-[16px]"
    },
    spacing: {
      card: "p-2",
      section: "space-y-3",
      button: "px-1.5 py-0.5"
    },
    layout: {
      sidebar: "w-56",
      header: "h-10"
    }
  },
  small: {
    text: {
      xs: "text-[10px]",
      sm: "text-[11px]",
      base: "text-[12px]",
      lg: "text-[14px]",
      xl: "text-[16px]",
      "2xl": "text-[18px]"
    },
    spacing: {
      card: "p-3",
      section: "space-y-4",
      button: "px-2 py-1"
    },
    layout: {
      sidebar: "w-60",
      header: "h-12"
    }
  },
  medium: {
    text: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl"
    },
    spacing: {
      card: "p-4",
      section: "space-y-6",
      button: "px-3 py-2"
    },
    layout: {
      sidebar: "w-64",
      header: "h-14"
    }
  },
  large: {
    text: {
      xs: "text-sm",
      sm: "text-base",
      base: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      "2xl": "text-3xl"
    },
    spacing: {
      card: "p-6",
      section: "space-y-8",
      button: "px-4 py-3"
    },
    layout: {
      sidebar: "w-72",
      header: "h-16"
    }
  },
  xl: {
    text: {
      xs: "text-base",
      sm: "text-lg",
      base: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
      "2xl": "text-4xl"
    },
    spacing: {
      card: "p-8",
      section: "space-y-10",
      button: "px-6 py-4"
    },
    layout: {
      sidebar: "w-80",
      header: "h-20"
    }
  }
}

interface UIScaleProviderProps {
  children: React.ReactNode
}

export function UIScaleProvider({ children }: UIScaleProviderProps) {
  const [scale, setScale] = useState<UIScale>(() => {
    // Initialize with saved scale or default
    if (typeof window !== "undefined") {
      return getSetting('uiScale')
    }
    return "medium"
  })

  // Get scale percentage
  const getScalePercentage = (currentScale: UIScale): number => {
    switch (currentScale) {
      case "xs": return 75
      case "small": return 85
      case "medium": return 100
      case "large": return 115
      case "xl": return 130
      default: return 100
    }
  }

  const scalePercentage = getScalePercentage(scale)

  // Load scale from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScale = getSetting('uiScale')
      if (savedScale !== scale) {
        setScale(savedScale)
      }
    }
  }, [])

  // Save scale to localStorage when changed
  useEffect(() => {
    localStorage.setItem("ui-scale", scale)
    
    // Apply CSS custom properties for global scaling
    const root = document.documentElement
    
    // Set CSS variables for scaling
    switch (scale) {
      case "xs":
        root.style.setProperty("--ui-scale-text", "0.75")
        root.style.setProperty("--ui-scale-spacing", "0.65")
        root.style.setProperty("--ui-scale-component", "0.75")
        root.style.setProperty("--ui-scale-multiplier", "0.75")
        root.style.fontSize = "12px"
        document.body.style.zoom = "0.75"
        break
      case "small":
        root.style.setProperty("--ui-scale-text", "0.875")
        root.style.setProperty("--ui-scale-spacing", "0.75")
        root.style.setProperty("--ui-scale-component", "0.85")
        root.style.setProperty("--ui-scale-multiplier", "0.85")
        root.style.fontSize = "14px"
        document.body.style.zoom = "0.85"
        break
      case "large":
        root.style.setProperty("--ui-scale-text", "1.125")
        root.style.setProperty("--ui-scale-spacing", "1.25")
        root.style.setProperty("--ui-scale-component", "1.15")
        root.style.setProperty("--ui-scale-multiplier", "1.15")
        root.style.fontSize = "18px"
        document.body.style.zoom = "1.15"
        break
      case "xl":
        root.style.setProperty("--ui-scale-text", "1.25")
        root.style.setProperty("--ui-scale-spacing", "1.5")
        root.style.setProperty("--ui-scale-component", "1.3")
        root.style.setProperty("--ui-scale-multiplier", "1.3")
        root.style.fontSize = "20px"
        document.body.style.zoom = "1.3"
        break
      default: // medium
        root.style.setProperty("--ui-scale-text", "1")
        root.style.setProperty("--ui-scale-spacing", "1")
        root.style.setProperty("--ui-scale-component", "1")
        root.style.setProperty("--ui-scale-multiplier", "1")
        root.style.fontSize = "16px"
        document.body.style.zoom = "1"
        break
    }
    
    // Add a class to the body for scale-specific styling
    document.body.className = document.body.className.replace(/ui-scale-\w+/g, '')
    document.body.classList.add(`ui-scale-${scale}`)
  }, [scale])

  const scaleClasses = scaleConfigs[scale]

  return (
    <UIScaleContext.Provider value={{ scale, setScale, scalePercentage, scaleClasses }}>
      {children}
    </UIScaleContext.Provider>
  )
}

export function useUIScale() {
  const context = useContext(UIScaleContext)
  if (context === undefined) {
    throw new Error("useUIScale must be used within a UIScaleProvider")
  }
  return context
}
