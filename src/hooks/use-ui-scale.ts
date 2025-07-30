"use client"

import { useUIScale } from "@/contexts/UIScaleContext"
import { cn } from "@/lib/utils"

export function useScaledClasses() {
  const { scale, scaleClasses } = useUIScale()
  
  return {
    scale,
    scaleClasses,
    getScaledText: (size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl") => scaleClasses.text[size],
    getScaledSpacing: (type: "card" | "section" | "button") => scaleClasses.spacing[type],
    getScaledLayout: (type: "sidebar" | "header") => scaleClasses.layout[type],
    scaledCard: cn("transition-all duration-200", scaleClasses.spacing.card),
    scaledText: cn("transition-all duration-200", scaleClasses.text.base),
    scaledTextSm: cn("transition-all duration-200", scaleClasses.text.sm),
    scaledTextXs: cn("transition-all duration-200", scaleClasses.text.xs),
    scaledTextLg: cn("transition-all duration-200", scaleClasses.text.lg),
  }
}

// Utility function to get scaled dimensions
export function getScaledSize(baseSize: number, scale: "small" | "medium" | "large"): number {
  const scaleMultipliers = {
    small: 0.875,
    medium: 1,
    large: 1.125
  }
  return Math.round(baseSize * scaleMultipliers[scale])
}
