import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  Tag, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Brain,
  Settings,
  Users,
  Target
} from 'lucide-react'

export default function GmailIntegrationDemo() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Gmail AI Integration</h1>
        <p className="text-lg text-gray-600">
          Automatically classify and organize your emails with AI-powered labels applied directly to Gmail
        </p>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>How Gmail Integration Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">1. Connect Gmail</h3>
              <p className="text-sm text-gray-600">
                Securely connect your Gmail account using OAuth2 authentication
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">2. AI Analysis</h3>
              <p className="text-sm text-gray-600">
                AI analyzes your emails and classifies them by prospect stage and importance
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">3. Apply Labels</h3>
              <p className="text-sm text-gray-600">
                Labels are automatically created and applied directly to your Gmail account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Labels Created */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>AI Labels Applied to Gmail</span>
          </CardTitle>
          <CardDescription>
            These labels are automatically created in your Gmail account and applied to emails based on AI classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Badge className="justify-center py-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
              AI/Cold-Outreach
            </Badge>
            <Badge className="justify-center py-2 bg-green-100 text-green-800 hover:bg-green-200">
              AI/Interested
            </Badge>
            <Badge className="justify-center py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
              AI/Qualified
            </Badge>
            <Badge className="justify-center py-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
              AI/Proposal
            </Badge>
            <Badge className="justify-center py-2 bg-red-100 text-red-800 hover:bg-red-200">
              AI/Negotiation
            </Badge>
            <Badge className="justify-center py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
              AI/Won
            </Badge>
            <Badge className="justify-center py-2 bg-gray-100 text-gray-800 hover:bg-gray-200">
              AI/Lost
            </Badge>
            <Badge className="justify-center py-2 bg-orange-100 text-orange-800 hover:bg-orange-200">
              AI/Follow-Up
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Key Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Real Gmail label creation and application</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">AI-powered prospect stage detection</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Bulk processing with rate limiting</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Error handling and retry logic</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Verification of applied labels</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Benefits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Automatic email organization in Gmail</span>
            </div>
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Identify prospects and leads instantly</span>
            </div>
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Streamlined sales pipeline management</span>
            </div>
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Save hours of manual email sorting</span>
            </div>
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Consistent categorization across team</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Ready to organize your Gmail with AI? Go to the Email Cleanup page to get started.</span>
            <Button asChild className="ml-4">
              <a href="/email-cleanup">
                Start Now <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Sample Email Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Sample Results</span>
          </CardTitle>
          <CardDescription>
            Examples of how emails would be classified and labeled in your Gmail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">Partnership Opportunity - Let's Connect</h4>
                <p className="text-sm text-gray-600">from: business@company.com</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">AI/Cold-Outreach</Badge>
            </div>
            <p className="text-sm text-gray-700">Gmail Label: ✅ Applied</p>
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">Re: Proposal Discussion - Next Steps</h4>
                <p className="text-sm text-gray-600">from: sarah@bigclient.com</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">AI/Proposal</Badge>
            </div>
            <p className="text-sm text-gray-700">Gmail Label: ✅ Applied</p>
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">Thanks for the great service!</h4>
                <p className="text-sm text-gray-600">from: happy@customer.com</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">AI/Won</Badge>
            </div>
            <p className="text-sm text-gray-700">Gmail Label: ✅ Applied</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
