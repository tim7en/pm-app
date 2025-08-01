/**
 * Centralized settings storage utility
 * Handles persistence and retrieval of all user appearance preferences
 */

export type Theme = "light" | "dark" | "system" | "auto"
export type UIScale = "xs" | "small" | "medium" | "large" | "xl"
export type FontSize = "small" | "medium" | "large"
export type Density = "compact" | "comfortable" | "spacious"

export interface AppearanceSettings {
  theme: Theme
  uiScale: UIScale
  fontSize: FontSize
  density: Density
  colorScheme: string
}

// Storage keys
const STORAGE_KEYS = {
  THEME: 'ui-theme',
  UI_SCALE: 'ui-scale',
  FONT_SIZE: 'font-size-preference',
  DENSITY: 'density-preference',
  COLOR_SCHEME: 'color-scheme-preference',
} as const

// Default settings
export const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'auto',
  uiScale: 'medium',
  fontSize: 'medium',
  density: 'comfortable',
  colorScheme: 'blue',
}

/**
 * Get all appearance settings from localStorage
 */
export function getAppearanceSettings(): AppearanceSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    return {
      theme: (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || DEFAULT_SETTINGS.theme,
      uiScale: (localStorage.getItem(STORAGE_KEYS.UI_SCALE) as UIScale) || DEFAULT_SETTINGS.uiScale,
      fontSize: (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSize) || DEFAULT_SETTINGS.fontSize,
      density: (localStorage.getItem(STORAGE_KEYS.DENSITY) as Density) || DEFAULT_SETTINGS.density,
      colorScheme: localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME) || DEFAULT_SETTINGS.colorScheme,
    }
  } catch (error) {
    console.warn('Failed to load appearance settings from localStorage:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Save all appearance settings to localStorage
 */
export function saveAppearanceSettings(settings: Partial<AppearanceSettings>): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (settings.theme !== undefined) {
      localStorage.setItem(STORAGE_KEYS.THEME, settings.theme)
    }
    if (settings.uiScale !== undefined) {
      localStorage.setItem(STORAGE_KEYS.UI_SCALE, settings.uiScale)
    }
    if (settings.fontSize !== undefined) {
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, settings.fontSize)
    }
    if (settings.density !== undefined) {
      localStorage.setItem(STORAGE_KEYS.DENSITY, settings.density)
    }
    if (settings.colorScheme !== undefined) {
      localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, settings.colorScheme)
    }
  } catch (error) {
    console.warn('Failed to save appearance settings to localStorage:', error)
  }
}

/**
 * Get a specific setting value
 */
export function getSetting<K extends keyof AppearanceSettings>(key: K): AppearanceSettings[K] {
  const settings = getAppearanceSettings()
  return settings[key]
}

/**
 * Save a specific setting value
 */
export function setSetting<K extends keyof AppearanceSettings>(
  key: K, 
  value: AppearanceSettings[K]
): void {
  saveAppearanceSettings({ [key]: value } as Partial<AppearanceSettings>)
}

/**
 * Apply font size settings to DOM
 */
export function applyFontSize(fontSize: FontSize): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  switch (fontSize) {
    case 'small':
      root.style.setProperty('--font-size-multiplier', '0.875')
      break
    case 'large':
      root.style.setProperty('--font-size-multiplier', '1.125')
      break
    default: // medium
      root.style.setProperty('--font-size-multiplier', '1')
      break
  }
}

/**
 * Apply density settings to DOM
 */
export function applyDensity(density: Density): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  switch (density) {
    case 'compact':
      root.style.setProperty('--density-multiplier', '0.75')
      break
    case 'spacious':
      root.style.setProperty('--density-multiplier', '1.25')
      break
    default: // comfortable
      root.style.setProperty('--density-multiplier', '1')
      break
  }
}

/**
 * Apply color scheme settings to DOM
 */
export function applyColorScheme(colorScheme: string): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.style.setProperty('--color-scheme', colorScheme)
}

/**
 * Apply all appearance settings to DOM
 */
export function applyAllSettings(settings: Partial<AppearanceSettings> = {}): void {
  const currentSettings = getAppearanceSettings()
  const settingsToApply = { ...currentSettings, ...settings }

  applyFontSize(settingsToApply.fontSize)
  applyDensity(settingsToApply.density)
  applyColorScheme(settingsToApply.colorScheme)
}

/**
 * Reset all settings to defaults
 */
export function resetAllSettings(): void {
  if (typeof window === 'undefined') return

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    applyAllSettings(DEFAULT_SETTINGS)
  } catch (error) {
    console.warn('Failed to reset settings:', error)
  }
}

/**
 * Export settings as JSON for backup
 */
export function exportSettings(): string {
  const settings = getAppearanceSettings()
  return JSON.stringify(settings, null, 2)
}

/**
 * Import settings from JSON backup
 */
export function importSettings(settingsJson: string): boolean {
  try {
    const settings = JSON.parse(settingsJson) as AppearanceSettings
    
    // Validate settings structure
    if (typeof settings !== 'object' || !settings.theme || !settings.uiScale) {
      throw new Error('Invalid settings format')
    }
    
    saveAppearanceSettings(settings)
    applyAllSettings(settings)
    return true
  } catch (error) {
    console.warn('Failed to import settings:', error)
    return false
  }
}
