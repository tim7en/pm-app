"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Sun, 
  Moon, 
  Monitor, 
  Clock, 
  Palette, 
  ZoomIn, 
  ZoomOut,
  Settings2
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useUIScale } from "@/contexts/UIScaleContext"
import { useTranslation } from "@/hooks/use-translation"

interface AppearanceSettingsProps {
  trigger?: React.ReactNode
}

export function AppearanceSettings({ trigger }: AppearanceSettingsProps) {
  const { theme, setTheme, actualTheme } = useTheme()
  const { scale, setScale, scalePercentage } = useUIScale()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const themeOptions = [
    {
      value: "light" as const,
      label: "Light",
      description: "Always use light theme",
      icon: Sun
    },
    {
      value: "dark" as const,
      label: "Dark", 
      description: "Always use dark theme",
      icon: Moon
    },
    {
      value: "system" as const,
      label: "System",
      description: "Follow system preference",
      icon: Monitor
    },
    {
      value: "auto" as const,
      label: "Time-based",
      description: "Light during day, dark at night",
      icon: Clock
    }
  ]

  const scaleOptions = [
    {
      value: "xs" as const,
      label: "Extra Small",
      description: "75% - Maximum content density",
      percentage: 75
    },
    {
      value: "small" as const,
      label: "Small",
      description: "85% - Compact interface",
      percentage: 85
    },
    {
      value: "medium" as const,
      label: "Medium",
      description: "100% - Default size",
      percentage: 100
    },
    {
      value: "large" as const,
      label: "Large",
      description: "115% - More comfortable",
      percentage: 115
    },
    {
      value: "xl" as const,
      label: "Extra Large",
      description: "130% - Maximum accessibility",
      percentage: 130
    }
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Appearance Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`p-2 rounded-lg ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-blue-100'}`}>
                  {actualTheme === 'dark' ? (
                    <Moon className="h-4 w-4 text-slate-200" />
                  ) : (
                    <Sun className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                Theme Preference
                <Badge variant="secondary" className="ml-auto">
                  Currently: {actualTheme === 'dark' ? 'Dark' : 'Light'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Choose how the interface should appear. Auto mode switches based on time of day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={(value) => setTheme(value as any)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themeOptions.map((option) => (
                    <div key={option.value} className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className={`
                          flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                          hover:bg-accent/50 peer-checked:border-primary peer-checked:bg-primary/5
                          ${theme === option.value ? 'border-primary bg-primary/5' : 'border-border'}
                        `}
                      >
                        <div className="p-2 rounded-lg bg-muted">
                          <option.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* UI Scale Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <ZoomIn className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Interface Scale
                <Badge variant="secondary" className="ml-auto">
                  {scalePercentage}%
                </Badge>
              </CardTitle>
              <CardDescription>
                Adjust the size of all interface elements. Smaller scales show more content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={scale} onValueChange={(value) => setScale(value as any)}>
                <div className="space-y-3">
                  {scaleOptions.map((option) => (
                    <div key={option.value} className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={`scale-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`scale-${option.value}`}
                        className={`
                          flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                          hover:bg-accent/50 peer-checked:border-primary peer-checked:bg-primary/5
                          ${scale === option.value ? 'border-primary bg-primary/5' : 'border-border'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            {option.percentage < 100 ? (
                              <ZoomOut className="h-4 w-4" />
                            ) : option.percentage > 100 ? (
                              <ZoomIn className="h-4 w-4" />
                            ) : (
                              <Monitor className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={scale === option.value ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {option.percentage}%
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>
                See how your settings affect the interface appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Sample Card</h4>
                    <Badge variant="secondary">New</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is how text and components will appear with your current settings.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">Primary</Button>
                    <Button size="sm" variant="outline">Secondary</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>
              Apply Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
