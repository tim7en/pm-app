/**
 * Z.AI GLM-4-32B Integration Service
 * Provides email classification using Z.AI's GLM-4-32B-0414-128K model
 */

interface ZaiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ZaiChatRequest {
  model: string
  messages: ZaiChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  top_p?: number
}

interface ZaiChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class ZaiClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.zai.ai' // Assuming this is the correct endpoint
  }

  async chatCompletion(request: ZaiChatRequest): Promise<ZaiChatResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Z.AI API Error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Analyze email content using GLM-4-32B model
   */
  async analyzeEmail(subject: string, body: string, from: string, analysisPrompt: string) {
    try {
      console.log('🤖 Calling Z.AI GLM-4-32B for email analysis...')
      
      const request: ZaiChatRequest = {
        model: 'glm-4-32b-0414-128k',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email analyst specializing in business email classification. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }

      const response = await this.chatCompletion(request)
      const aiResponse = response.choices[0]?.message?.content

      if (aiResponse) {
        console.log('🤖 Z.AI Raw Response:', aiResponse)
        
        try {
          const result = JSON.parse(aiResponse)
          console.log('✅ Z.AI Analysis Success:', result)
          return result
        } catch (parseError) {
          console.error('❌ Failed to parse Z.AI response as JSON:', parseError)
          throw new Error('Invalid JSON from Z.AI')
        }
      } else {
        throw new Error('No response from Z.AI')
      }
    } catch (error) {
      console.error('❌ Z.AI API Error:', error)
      throw error
    }
  }
}

export default ZaiClient
