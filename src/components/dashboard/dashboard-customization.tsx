"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Settings, 
  Grid3X3, 
  RotateCcw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  Move,
  Layout,
  Maximize2,
  Minimize2
} from "lucide-react"
import { 
  getDashboardLayout, 
  saveDashboardLayout,
  resetDashboardLayout,
  updateGridConfig,
  toggleWidgetVisibility,
  exportDashboardLayout,
  importDashboardLayout,
  getAvailableWidgetTypes,
  type DashboardLayout 
} from "@/lib/dashboard-layout-storage"
import { useToast } from "@/hooks/use-toast"

interface DashboardCustomizationProps {
  onLayoutChange?: (layout: DashboardLayout) => void
}

export function DashboardCustomization({ onLayoutChange }: DashboardCustomizationProps) {
  const [open, setOpen] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout>(() => getDashboardLayout())
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const currentLayout = getDashboardLayout()
    setLayout(currentLayout)
  }, [])

  const handleGridColsChange = (value: number[]) => {
    const newCols = value[0]
    const updatedLayout = { ...layout, gridCols: newCols }
    setLayout(updatedLayout)
    updateGridConfig(newCols, layout.compact)
    onLayoutChange?.(updatedLayout)
  }

  const handleCompactModeToggle = (compact: boolean) => {
    const updatedLayout = { ...layout, compact }
    setLayout(updatedLayout)
    updateGridConfig(layout.gridCols, compact)
    onLayoutChange?.(updatedLayout)
  }

  const handleWidgetVisibilityToggle = (widgetId: string) => {
    toggleWidgetVisibility(widgetId)
    const updatedLayout = getDashboardLayout()
    setLayout(updatedLayout)
    onLayoutChange?.(updatedLayout)
    
    const widget = updatedLayout.widgets.find(w => w.id === widgetId)
    toast({
      title: widget?.visible ? "Widget Enabled" : "Widget Hidden",
      description: `${widget?.title} is now ${widget?.visible ? 'visible' : 'hidden'} on your dashboard.`,
    })
  }

  const handleResetLayout = () => {
    resetDashboardLayout()
    const defaultLayout = getDashboardLayout()
    setLayout(defaultLayout)
    onLayoutChange?.(defaultLayout)
    toast({
      title: "Layout Reset",
      description: "Dashboard layout has been reset to default configuration.",
    })
  }

  const handleExportLayout = () => {
    try {
      const layoutJson = exportDashboardLayout()
      const blob = new Blob([layoutJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Layout Exported",
        description: "Dashboard layout has been saved to your downloads.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard layout. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportLayout = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            if (importDashboardLayout(content)) {
              const importedLayout = getDashboardLayout()
              setLayout(importedLayout)
              onLayoutChange?.(importedLayout)
              toast({
                title: "Layout Imported",
                description: "Dashboard layout has been successfully imported.",
              })
            } else {
              throw new Error('Invalid layout file')
            }
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Invalid layout file. Please check the file and try again.",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const availableWidgets = getAvailableWidgetTypes()
  const visibleWidgetsCount = layout.widgets.filter(w => w.visible).length

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hover-lift">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Layout className="h-4 w-4 mr-2" />
            Layout Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDraggingEnabled(!isDraggingEnabled)}>
            <Move className="h-4 w-4 mr-2" />
            {isDraggingEnabled ? 'Lock Layout' : 'Enable Dragging'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportLayout}>
            <Download className="h-4 w-4 mr-2" />
            Export Layout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportLayout}>
            <Upload className="h-4 w-4 mr-2" />
            Import Layout
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetLayout}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Dashboard Customization
            </DialogTitle>
            <DialogDescription>
              Customize your dashboard layout, grid settings, and widget visibility.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Grid Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Grid Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Grid Columns</label>
                      <Badge variant="secondary">{layout.gridCols}</Badge>
                    </div>
                    <Slider
                      value={[layout.gridCols]}
                      onValueChange={handleGridColsChange}
                      max={6}
                      min={2}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust the number of columns in your dashboard grid
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Compact Mode</label>
                      <p className="text-xs text-muted-foreground">
                        Reduce spacing between widgets
                      </p>
                    </div>
                    <Switch
                      checked={layout.compact}
                      onCheckedChange={handleCompactModeToggle}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Widget Visibility */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Widget Visibility
                    </div>
                    <Badge variant="outline">{visibleWidgetsCount} visible</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {layout.widgets.map((widget) => {
                      const widgetInfo = availableWidgets.find(w => w.id === widget.type)
                      return (
                        <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {widget.visible ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{widget.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {widgetInfo?.description || 'Dashboard widget'}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={widget.visible}
                            onCheckedChange={() => handleWidgetVisibilityToggle(widget.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Layout Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Layout Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Last Modified:</span>
                    <span>{new Date(layout.lastModified).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Widgets:</span>
                    <span>{layout.widgets.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Dragging Mode:</span>
                    <Badge variant={isDraggingEnabled ? "default" : "secondary"}>
                      {isDraggingEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetLayout}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
