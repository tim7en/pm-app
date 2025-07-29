"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { exportData, exportTasksCSV, exportProjectsCSV, importDataFromFile } from "@/lib/export-utils"
import { exportTasksToPDF, exportProjectsToPDF, exportDashboardToPDF } from "@/lib/pdf-export"

interface DownloadMenuProps {
  tasks?: any[]
  projects?: any[]
  users?: any[]
  onImportData?: (data: any) => Promise<void>
}

export function DownloadMenu({ tasks, projects, users, onImportData }: DownloadMenuProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')

  const handleExportJSON = () => {
    exportData(tasks || [], projects || [], users || [])
  }

  const handleExportTasksCSV = () => {
    exportTasksCSV(tasks || [])
  }

  const handleExportProjectsCSV = () => {
    exportProjectsCSV(projects || [])
  }

  const handleExportTasksPDF = async () => {
    try {
      await exportTasksToPDF(tasks || [], projects || [])
    } catch (error) {
      console.error('Error exporting tasks to PDF:', error)
    }
  }

  const handleExportProjectsPDF = async () => {
    try {
      await exportProjectsToPDF(projects || [])
    } catch (error) {
      console.error('Error exporting projects to PDF:', error)
    }
  }

  const handleExportDashboardPDF = async () => {
    try {
      await exportDashboardToPDF('dashboard-content', 'dashboard-report')
    } catch (error) {
      console.error('Error exporting dashboard to PDF:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportStatus('idle')
      setImportMessage('')
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !onImportData) return

    setIsImporting(true)
    setImportStatus('idle')
    setImportMessage('')

    try {
      const data = await importDataFromFile(selectedFile)
      await onImportData(data)
      setImportStatus('success')
      setImportMessage('Data imported successfully!')
      
      // Close dialog after successful import
      setTimeout(() => {
        setImportDialogOpen(false)
        setSelectedFile(null)
        setImportStatus('idle')
        setImportMessage('')
      }, 2000)
    } catch (error) {
      setImportStatus('error')
      setImportMessage(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleInstallApp = () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // For PWA installation
      const deferredPrompt = (window as any).deferredPrompt
      if (deferredPrompt) {
        deferredPrompt.prompt()
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt')
          } else {
            console.log('User dismissed the install prompt')
          }
          (window as any).deferredPrompt = null
        })
      } else {
        // Show instructions for manual install
        setInstallDialogOpen(true)
      }
    } else {
      setInstallDialogOpen(true)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileJson className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Complete Backup (JSON)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTasksCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Tasks (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportProjectsCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Projects (CSV)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileText className="h-4 w-4 mr-2" />
              Export Reports (PDF)
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleExportTasksPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Tasks Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportProjectsPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Projects Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDashboardPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Dashboard View
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleInstallApp}>
            <Smartphone className="h-4 w-4 mr-2" />
            Install App
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Upload a previously exported JSON file to restore your tasks and projects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Export File</Label>
              <Input
                id="file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>

            {importStatus === 'success' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{importMessage}</AlertDescription>
              </Alert>
            )}

            {importStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Install App Dialog */}
      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Install Task Manager App</DialogTitle>
            <DialogDescription>
              Install our app on your device for quick access and offline functionality.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Monitor className="h-6 w-6 text-blue-500" />
                <div>
                  <h4 className="font-medium">Desktop (Chrome/Edge)</h4>
                  <p className="text-sm text-muted-foreground">
                    Click the install icon in the address bar or go to Settings → Install app
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Smartphone className="h-6 w-6 text-green-500" />
                <div>
                  <h4 className="font-medium">Mobile (Chrome/Safari)</h4>
                  <p className="text-sm text-muted-foreground">
                    Tap "Add to Home Screen" from your browser's menu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Tablet className="h-6 w-6 text-purple-500" />
                <div>
                  <h4 className="font-medium">Tablet</h4>
                  <p className="text-sm text-muted-foreground">
                    Same instructions as mobile - use your browser's menu to install
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Once installed, you'll be able to use the app offline and receive notifications.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => setInstallDialogOpen(false)}>
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}