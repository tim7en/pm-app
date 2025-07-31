/**
 * Dynamic Color Generator for Projects
 * Generates unique colors for projects based on project name and creation order
 */

export class ProjectColorGenerator {
  private static instance: ProjectColorGenerator
  private usedColors: Set<string> = new Set()
  
  // Predefined color palette for projects
  private readonly colorPalette = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#eab308', // yellow-500
    '#a855f7', // purple-500
    '#22c55e', // green-500
    '#0ea5e9', // sky-500
    '#f43f5e', // rose-500
    '#64748b', // slate-500
    '#78716c', // stone-500
    '#dc2626', // red-600
    '#059669', // emerald-600
    '#2563eb', // blue-600
    '#7c3aed', // violet-600
    '#d97706', // amber-600
    '#0891b2', // cyan-600
    '#65a30d', // lime-600
    '#ea580c', // orange-600
    '#db2777', // pink-600
    '#4f46e5', // indigo-600
    '#0d9488', // teal-600
    '#ca8a04', // yellow-600
  ]

  private constructor() {}

  public static getInstance(): ProjectColorGenerator {
    if (!ProjectColorGenerator.instance) {
      ProjectColorGenerator.instance = new ProjectColorGenerator()
    }
    return ProjectColorGenerator.instance
  }

  /**
   * Generate a unique color for a project based on its name and ID
   */
  public generateProjectColor(projectName: string, projectId: string): string {
    // Create a hash from project name and ID for consistency
    const hash = this.hashString(projectName + projectId)
    
    // Use hash to select color from palette
    const colorIndex = Math.abs(hash) % this.colorPalette.length
    let selectedColor = this.colorPalette[colorIndex]
    
    // If color is already used, find the next available color
    let attempts = 0
    while (this.usedColors.has(selectedColor) && attempts < this.colorPalette.length) {
      const nextIndex = (colorIndex + attempts + 1) % this.colorPalette.length
      selectedColor = this.colorPalette[nextIndex]
      attempts++
    }
    
    // If all colors are used, generate a variation of the selected color
    if (attempts >= this.colorPalette.length) {
      selectedColor = this.generateColorVariation(selectedColor, hash)
    }
    
    this.usedColors.add(selectedColor)
    return selectedColor
  }

  /**
   * Generate a color variation when all palette colors are used
   */
  private generateColorVariation(baseColor: string, seed: number): string {
    // Convert hex to HSL
    const hsl = this.hexToHsl(baseColor)
    
    // Create variation by adjusting hue slightly
    const hueShift = (Math.abs(seed) % 60) - 30 // -30 to +30 degrees
    let newHue = (hsl.h + hueShift) % 360
    if (newHue < 0) newHue += 360
    
    // Slight saturation and lightness variations
    const satShift = (Math.abs(seed * 2) % 20) - 10 // -10% to +10%
    const lightShift = (Math.abs(seed * 3) % 20) - 10 // -10% to +10%
    
    const newSat = Math.max(20, Math.min(90, hsl.s + satShift))
    const newLight = Math.max(25, Math.min(75, hsl.l + lightShift))
    
    return this.hslToHex(newHue, newSat, newLight)
  }

  /**
   * Convert hex to HSL
   */
  private hexToHsl(hex: string): { h: number, s: number, l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  /**
   * Reset used colors (useful when refreshing project list)
   */
  public resetUsedColors(): void {
    this.usedColors.clear()
  }

  /**
   * Get color for existing project (doesn't mark as used)
   */
  public getProjectColor(projectName: string, projectId: string): string {
    const hash = this.hashString(projectName + projectId)
    const colorIndex = Math.abs(hash) % this.colorPalette.length
    return this.colorPalette[colorIndex]
  }

  /**
   * Generate a hash from string for consistent color selection
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  /**
   * Generate a random color when palette is exhausted
   */
  private generateRandomColor(seed: number): string {
    // Use seed to generate consistent "random" color
    const hue = Math.abs(seed) % 360
    const saturation = 50 + (Math.abs(seed * 2) % 30) // 50-80%
    const lightness = 45 + (Math.abs(seed * 3) % 15) // 45-60%
    
    return this.hslToHex(hue, saturation, lightness)
  }

  /**
   * Convert HSL to HEX color
   */
  private hslToHex(h: number, s: number, l: number): string {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  /**
   * Get lighter variant of a color for hover states
   */
  public getLighterVariant(color: string, amount: number = 20): string {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Lighten by amount
    const newR = Math.min(255, r + amount)
    const newG = Math.min(255, g + amount)
    const newB = Math.min(255, b + amount)
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }

  /**
   * Get darker variant of a color
   */
  public getDarkerVariant(color: string, amount: number = 20): string {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Darken by amount
    const newR = Math.max(0, r - amount)
    const newG = Math.max(0, g - amount)
    const newB = Math.max(0, b - amount)
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }

  /**
   * Check if a color is light or dark (for text contrast)
   */
  public isLightColor(color: string): boolean {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }

  /**
   * Get appropriate text color (black or white) for a background color
   */
  public getContrastTextColor(backgroundColor: string): string {
    return this.isLightColor(backgroundColor) ? '#000000' : '#ffffff'
  }
}

// Export singleton instance
export const projectColorGenerator = ProjectColorGenerator.getInstance()
