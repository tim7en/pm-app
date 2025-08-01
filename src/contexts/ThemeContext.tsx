"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system" | "auto"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("auto")
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light")

  // Function to get system preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  }

  // Function to get time-based theme
  const getTimeBasedTheme = (): "light" | "dark" => {
    const hour = new Date().getHours()
    // Dark theme from 6 PM to 6 AM (18:00 to 06:00)
    return (hour >= 18 || hour < 6) ? "dark" : "light"
  }

  // Function to determine actual theme
  const determineActualTheme = (currentTheme: Theme): "light" | "dark" => {
    switch (currentTheme) {
      case "light":
        return "light"
      case "dark":
        return "dark"
      case "system":
        return getSystemTheme()
      case "auto":
        return getTimeBasedTheme()
      default:
        return "light"
    }
  }

  // Apply theme to document
  const applyTheme = (theme: "light" | "dark") => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    setActualTheme(theme)
  }

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("ui-theme") as Theme
    if (savedTheme && ["light", "dark", "system", "auto"].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  // Apply theme changes
  useEffect(() => {
    const newActualTheme = determineActualTheme(theme)
    applyTheme(newActualTheme)
    
    // Save to localStorage
    localStorage.setItem("ui-theme", theme)
  }, [theme])

  // Set up listeners for system theme and time changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        const newActualTheme = determineActualTheme(theme)
        applyTheme(newActualTheme)
      }
      
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
    
    if (theme === "auto") {
      // Check time every minute to update theme if needed
      const interval = setInterval(() => {
        const newActualTheme = determineActualTheme(theme)
        if (newActualTheme !== actualTheme) {
          applyTheme(newActualTheme)
        }
      }, 60000) // Check every minute
      
      return () => clearInterval(interval)
    }
  }, [theme, actualTheme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
