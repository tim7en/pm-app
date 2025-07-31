"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle2, 
  Users, 
  Calendar,
  Sparkles,
  Copy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProjectInsightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export function ProjectInsightsDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName 
}: ProjectInsightsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const { toast } = useToast()

  const generateInsights = async () => {
    setLoading(true)
    try {
      // AI insights temporarily disabled due to API key issues
      toast({
        title: "AI Insights Unavailable",
        description: "AI insights are temporarily disabled due to API key issues. Please try again later.",
        variant: "destructive",
      })
      
      // const response = await fetch(`/api/ai/assess-project?projectId=${projectId}`)
      // if (response.ok) {
      //   const data = await response.json()
      //   setInsights(data.assessment)
      // } else {
      //   toast({
      //     title: "Error",
      //     description: "Unable to generate insights at this time. Please try again later.",
      //     variant: "destructive",
      //   })
      // }
    } catch (error) {
      console.error('Error generating insights:', error)
      toast({
        title: "Error",
        description: "Unable to generate insights at this time. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReport = () => {
    if (!insights) return
    
    const report = `
🔍 Project Analysis Report: ${projectName}

📊 Project Overview:
• Efficiency Score: ${insights.efficiencyScore || 'N/A'}%
• Completion Trend: ${insights.trend || 'Stable'}
• Focus Area: ${insights.focusArea || 'Balanced'}

⏰ Timeline Analysis:
• Project appears to be ${insights.trend === 'Improving' ? 'on track' : 'progressing steadily'}
• Task completion rate is ${insights.efficiencyScore > 80 ? 'excellent' : insights.efficiencyScore > 60 ? 'good' : 'needs attention'}

✅ What's Been Done:
• Multiple tasks have been completed
• Team collaboration is active
• Project milestones are being tracked

🎯 Recommendations:
${insights.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || '• Continue current momentum\n• Regular check-ins recommended\n• Consider task prioritization'}

📈 Next Steps:
• Monitor task completion rates
• Ensure team alignment on priorities
• Regular progress reviews
    `
    
    navigator.clipboard.writeText(report)
    toast({
      title: "Report Copied",
      description: "The project analysis report has been copied to your clipboard.",
    })
  }

  // Generate insights when dialog opens
  useState(() => {
    if (open && !insights && !loading) {
      generateInsights()
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Project Insights
          </DialogTitle>
          <DialogDescription>
            Comprehensive analysis for {projectName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Analyzing project data...</p>
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-500">
                    {insights.efficiencyScore || 'N/A'}%
                  </p>
                  <p className="text-sm text-muted-foreground">Efficiency Score</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-blue-500">
                    {insights.trend || 'Stable'}
                  </p>
                  <p className="text-sm text-muted-foreground">Completion Trend</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-purple-500">
                    {insights.focusArea || 'Balanced'}
                  </p>
                  <p className="text-sm text-muted-foreground">Focus Area</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Timeline Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline Analysis
              </h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p>• Project appears to be <strong>{insights.trend === 'Improving' ? 'on track' : 'progressing steadily'}</strong></p>
                <p>• Task completion rate is <strong>{insights.efficiencyScore > 80 ? 'excellent' : insights.efficiencyScore > 60 ? 'good' : 'needs attention'}</strong></p>
                <p>• Team collaboration is active with regular updates</p>
              </div>
            </div>

            {/* What's Been Done */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                What's Been Done
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
                <p>✅ Multiple tasks have been completed</p>
                <p>✅ Team collaboration is active</p>
                <p>✅ Project milestones are being tracked</p>
                <p>✅ Progress monitoring is in place</p>
              </div>
            </div>

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {insights.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-orange-500 font-bold">•</span>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Next Steps
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                <p>📈 Monitor task completion rates</p>
                <p>👥 Ensure team alignment on priorities</p>
                <p>🔍 Regular progress reviews</p>
                <p>⚡ Optimize workflow processes</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={copyReport} variant="outline" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy Report
              </Button>
              <Button onClick={() => generateInsights()} variant="outline">
                Refresh Analysis
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No insights available</p>
            <Button onClick={generateInsights}>Generate Insights</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
