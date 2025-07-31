import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || 'dummy-key',
})

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, emailContent, context } = await request.json()

    if (action === 'classify') {
      // Classify email priority and category
      const classificationPrompt = `
Analyze the following email and classify it:

Email Content: "${emailContent}"

Please provide:
1. Priority level (high, medium, low)
2. Category (work, personal, promotional, notification, urgent, meeting, invoice, etc.)
3. Requires action (true/false)
4. Sentiment (positive, neutral, negative)
5. Brief summary (max 50 words)

Respond in JSON format.
`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that helps classify and analyze emails. Always respond with valid JSON.'
          },
          { role: 'user', content: classificationPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })

      const classification = JSON.parse(completion.choices[0].message.content || '{}')

      return NextResponse.json({
        success: true,
        classification: {
          priority: classification.priority || 'medium',
          category: classification.category || 'general',
          requiresAction: classification.requiresAction || false,
          sentiment: classification.sentiment || 'neutral',
          summary: classification.summary || emailContent.substring(0, 100) + '...'
        }
      })
    }

    if (action === 'draft_reply') {
      // Generate AI draft reply
      const draftPrompt = `
Generate a professional email reply for the following email:

Original Email: "${emailContent}"
Context: ${context || 'General business correspondence'}

Please create a thoughtful, professional reply that:
1. Acknowledges the original message
2. Addresses any questions or requests
3. Maintains a professional tone
4. Is concise but complete

Only provide the email body content, no subject line.
`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional email assistant. Generate clear, professional email replies.'
          },
          { role: 'user', content: draftPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      const draftReply = completion.choices[0].message.content || ''

      return NextResponse.json({
        success: true,
        draftReply: draftReply.trim()
      })
    }

    if (action === 'summarize') {
      // Summarize email thread
      const summaryPrompt = `
Summarize the following email thread:

Email Content: "${emailContent}"

Provide:
1. Key points discussed
2. Action items identified
3. Decisions made
4. Next steps required

Keep the summary concise but comprehensive.
`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that creates concise, accurate email summaries.'
          },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,
        max_tokens: 400
      })

      const summary = completion.choices[0].message.content || ''

      return NextResponse.json({
        success: true,
        summary: summary.trim()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing AI request:', error)
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
