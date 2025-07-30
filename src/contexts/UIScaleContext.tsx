"use client"

import { createContext, useContext, useEffect, useState } from "react"

type UIScale = "small" | "medium" | "large"

interface UIScaleContextType {
  scale: UIScale
  setScale: (scale: UIScale) => void
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
  }
}

interface UIScaleProviderProps {
  children: React.ReactNode
}

export function UIScaleProvider({ children }: UIScaleProviderProps) {
  const [scale, setScale] = useState<UIScale>("medium")

  // Load scale from localStorage on mount
  useEffect(() => {
    const savedScale = localStorage.getItem("ui-scale") as UIScale
    if (savedScale && ["small", "medium", "large"].includes(savedScale)) {
      setScale(savedScale)
    }
  }, [])

  // Save scale to localStorage when changed
  useEffect(() => {
    localStorage.setItem("ui-scale", scale)
    
    // Apply CSS custom properties for global scaling
    const root = document.documentElement
    
    // Set CSS variables for scaling
    switch (scale) {
      case "small":
        root.style.setProperty("--ui-scale-text", "0.875")
        root.style.setProperty("--ui-scale-spacing", "0.75")
        root.style.setProperty("--ui-scale-component", "0.9")
        root.style.setProperty("--ui-scale-multiplier", "0.9")
        // Apply smaller text sizes
        root.style.fontSize = "14px"
        break
      case "large":
        root.style.setProperty("--ui-scale-text", "1.125")
        root.style.setProperty("--ui-scale-spacing", "1.25")
        root.style.setProperty("--ui-scale-component", "1.1")
        root.style.setProperty("--ui-scale-multiplier", "1.1")
        // Apply larger text sizes
        root.style.fontSize = "18px"
        break
      default: // medium
        root.style.setProperty("--ui-scale-text", "1")
        root.style.setProperty("--ui-scale-spacing", "1")
        root.style.setProperty("--ui-scale-component", "1")
        root.style.setProperty("--ui-scale-multiplier", "1")
        // Reset to default text size
        root.style.fontSize = "16px"
        break
    }
    
    // Add a class to the body for scale-specific styling
    document.body.className = document.body.className.replace(/ui-scale-\w+/g, '')
    document.body.classList.add(`ui-scale-${scale}`)
  }, [scale])

  const scaleClasses = scaleConfigs[scale]

  return (
    <UIScaleContext.Provider value={{ scale, setScale, scaleClasses }}>
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
