import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { accessToken, refreshToken, action = 'test-connection', sampleSize = 20 } = requestBody
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      )
    }

    // Initialize Gmail service
    const gmailService = new GmailService(GMAIL_CONFIG)
    gmailService.setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: '',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000
    })

    console.log(`🧪 Gmail debug action: ${action}`)

    switch (action) {
      case 'test-connection':
        try {
          const profile = await gmailService.getProfile()
          console.log('✅ Gmail connection successful:', profile.emailAddress)
          
          return NextResponse.json({
            success: true,
            result: {
              email: profile.emailAddress,
              totalMessages: profile.messagesTotal,
              totalThreads: profile.threadsTotal
            }
          })
        } catch (error) {
          console.error('❌ Gmail connection failed:', error)
          return NextResponse.json({
            success: false,
            error: `Gmail connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      case 'test-permissions':
        try {
          // Test reading permissions
          const emails = await gmailService.getAllEmails({ maxResults: 1 })
          console.log('✅ Read permission test successful')
          
          // Test label creation permissions
          const testLabelId = await gmailService.createLabel('AI-Test-Label-' + Date.now())
          console.log('✅ Label creation test successful:', testLabelId)
          
          // Clean up test label
          // Note: Gmail API doesn't have delete label endpoint, so we'll leave it
          
          return NextResponse.json({
            success: true,
            result: {
              readPermission: true,
              labelCreationPermission: true,
              testLabelId
            }
          })
        } catch (error) {
          console.error('❌ Permission test failed:', error)
          return NextResponse.json({
            success: false,
            error: `Permission test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      case 'test-label-application':
        try {
          // Get one email
          const emails = await gmailService.getAllEmails({ maxResults: 1 })
          if (emails.emails.length === 0) {
            return NextResponse.json({
              success: false,
              error: 'No emails found to test label application'
            })
          }

          const testEmail = emails.emails[0]
          console.log(`🧪 Testing label application on email: ${testEmail.subject}`)
          
          // Create a test label
          const testLabelId = await gmailService.createLabel('AI-Test-Application-' + Date.now())
          console.log('✅ Created test label:', testLabelId)
          
          // Apply the label
          const success = await gmailService.applyLabelWithRetry(testEmail.id, testLabelId)
          console.log('Label application result:', success)
          
          // Verify the label was applied
          const verified = await gmailService.verifyLabelApplied(testEmail.id, testLabelId)
          console.log('Label verification result:', verified)
          
          return NextResponse.json({
            success: true,
            result: {
              emailId: testEmail.id,
              emailSubject: testEmail.subject,
              testLabelId,
              applicationSuccess: success,
              verificationSuccess: verified
            }
          })
        } catch (error) {
          console.error('❌ Label application test failed:', error)
          return NextResponse.json({
            success: false,
            error: `Label application test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      case 'list-existing-labels':
        try {
          const labels = await gmailService.getLabels()
          const aiLabels = labels.filter(label => label.name?.startsWith('AI/'))
          
          console.log(`📋 Found ${labels.length} total labels, ${aiLabels.length} AI labels`)
          
          return NextResponse.json({
            success: true,
            result: {
              totalLabels: labels.length,
              aiLabels: aiLabels.map(l => ({ id: l.id, name: l.name })),
              allLabels: labels.slice(0, 20).map(l => ({ id: l.id, name: l.name })) // First 20 for debugging
            }
          })
        } catch (error) {
          console.error('❌ List labels failed:', error)
          return NextResponse.json({
            success: false,
            error: `List labels failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      case 'list-labels':
        try {
          const labels = await gmailService.getLabels()
          
          console.log(`📋 Retrieved ${labels.length} Gmail labels`)
          
          return NextResponse.json({
            success: true,
            result: {
              labels: labels.map(l => ({ 
                id: l.id, 
                name: l.name, 
                type: l.type,
                messagesTotal: l.messagesTotal || 0,
                messagesUnread: l.messagesUnread || 0,
                threadsTotal: l.threadsTotal || 0,
                threadsUnread: l.threadsUnread || 0
              }))
            }
          })
        } catch (error) {
          console.error('❌ List labels failed:', error)
          return NextResponse.json({
            success: false,
            error: `List labels failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      case 'sample-emails':
        try {
          const result = await gmailService.getAllEmails({ 
            maxResults: sampleSize,
            query: '',
            includeSpamTrash: false
          })
          
          const emails = result.emails || []
          console.log(`📧 Retrieved ${emails.length} sample emails`)
          
          return NextResponse.json({
            success: true,
            result: {
              emails: emails.map(email => ({
                id: email.id,
                threadId: email.threadId,
                subject: email.subject,
                from: email.from,
                to: email.to,
                snippet: email.snippet,
                internalDate: email.internalDate,
                labelIds: email.labelIds,
                body: email.body
              }))
            }
          })
        } catch (error) {
          console.error('❌ Sample emails failed:', error)
          return NextResponse.json({
            success: false,
            error: `Sample emails failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      case 'get-email':
        try {
          const { messageId } = requestBody
          if (!messageId) {
            return NextResponse.json({
              success: false,
              error: 'messageId is required for get-email action'
            }, { status: 400 })
          }

          // Get the full email content using the new method
          const parsedEmail = await gmailService.getEmailById(messageId)
          console.log(`✅ Retrieved email: ${parsedEmail.subject}`)

          return NextResponse.json({
            success: true,
            result: {
              email: parsedEmail
            }
          })
        } catch (error) {
          console.error('❌ Get email failed:', error)
          return NextResponse.json({
            success: false,
            error: `Get email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Gmail debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
