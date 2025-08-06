import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
// import OpenAI from 'openai' // Commented out - now using Z.AI
import { ZaiClient } from '@/lib/zai-client'

// Initialize OpenAI with API key (kept for fallback)
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY || '',
// })

// Initialize Z.AI client
const zai = new ZaiClient(process.env.ZAI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      projectName, 
      description, 
      category, 
      priority,
      existingProjects = [],
      workspaceMembers = [],
      language = 'en'
    } = body

    if (!projectName || !description) {
      return NextResponse.json(
        { error: 'Project name and description are required' },
        { status: 400 }
      )
    }

    // Create context-aware prompt for project analysis
    const systemPrompt = getSystemPrompt(language)
    const userPrompt = `
Analyze the following project for comprehensive task generation and planning:

**Project Details:**
- Name: ${projectName}
- Description: ${description}
- Category: ${category}
- Priority: ${priority}

**Context:**
- Existing projects in workspace: ${existingProjects.map(p => `${p.name} (${p.category})`).join(', ') || 'None'}
- Available team members: ${workspaceMembers.map(m => `${m.name} (${m.role})`).join(', ') || 'None'}

Provide a structured analysis including:
1. Project complexity assessment
2. Recommended timeline
3. Key milestones
4. Risk factors
5. Success metrics
6. Recommended team structure
`

    try {
      console.log('🤖 Using Z.AI for project context analysis...')
      
      const completion = await zai.chat.completions.create({
        model: "glm-4-32b-0414-128k",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const analysisText = completion.choices[0]?.message?.content

      if (!analysisText) {
        throw new Error('No analysis generated from Z.AI')
      }

      // Parse the analysis into structured data
      const analysis = parseAnalysis(analysisText, language)

      console.log('✅ Z.AI analysis successful')
      return NextResponse.json({ analysis })
    } catch (zaiError: any) {
      console.error('Z.AI API error:', zaiError)
      
      // Fallback to OpenAI if available (commented out for now)
      /*
      try {
        console.log('🔄 Falling back to OpenAI...')
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || '',
        })
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })

        const analysisText = completion.choices[0]?.message?.content

        if (!analysisText) {
          throw new Error('No analysis generated from OpenAI fallback')
        }

        const analysis = parseAnalysis(analysisText, language)
        console.log('✅ OpenAI fallback successful')
        return NextResponse.json({ analysis })
      } catch (openaiError: any) {
        console.error('OpenAI fallback also failed:', openaiError)
      }
      */
      
      // Fallback to mock analysis if Z.AI fails
      console.log('🔄 Using mock analysis fallback...')
      const mockAnalysis = createMockAnalysis(projectName, category, priority, language)
      return NextResponse.json({ analysis: mockAnalysis })
    }

  } catch (error) {
    console.error('Project analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze project context' },
      { status: 500 }
    )
  }
}

function getSystemPrompt(language: string): string {
  const prompts = {
    en: `You are an expert AI project manager and consultant with deep expertise in project planning, task breakdown, and team coordination. You specialize in creating comprehensive project analyses that lead to successful project execution.

Your role is to analyze project requirements and provide detailed insights that will be used to generate optimized task lists, timelines, and resource allocation strategies.

Provide responses in clear, structured format focusing on:
- Realistic timeline estimation
- Comprehensive risk assessment
- Optimal team structure recommendations
- Key milestone identification
- Success metrics definition

Always consider industry best practices and real-world constraints in your analysis.`,

    ru: `Вы - экспертный ИИ проект-менеджер и консультант с глубокой экспертизой в планировании проектов, декомпозиции задач и координации команды. Вы специализируетесь на создании комплексных анализов проектов, которые приводят к успешному выполнению проектов.

Ваша роль - анализировать требования проекта и предоставлять детальные инсайты, которые будут использованы для генерации оптимизированных списков задач, временных рамок и стратегий распределения ресурсов.

Предоставляйте ответы в четком, структурированном формате, фокусируясь на:
- Реалистичной оценке временных рамок
- Комплексной оценке рисков
- Рекомендациях по оптимальной структуре команды
- Идентификации ключевых вех
- Определении метрик успеха

Всегда учитывайте лучшие отраслевые практики и реальные ограничения в своем анализе.`,

    uz: `Сиз проект режалаштириш, вазифаларни бўлиш ва жамоа мувофиқлаштиришда чуқур тажрибага эга бўлган мутахассис ЯИ проект менежери ва маслаҳатчисиз. Сиз муваффақиятли проект амалга оширишга олиб келадиган комплекс проект таҳлилларини яратишга ихтисослашгансиз.

Сизнинг вазифангиз - проект талабларини таҳлил қилиш ва оптималлаштирилган вазифалар рўйхати, вақт жадваллари ва ресурс тақсимлаш стратегияларини яратиш учун фойдаланиладиган батафсил тушунчаларни таъминлашдир.

Жавобларни аниқ, тузилган форматда беринг, қуйидагиларга эътибор қаратинг:
- Реалистик вақт баҳолаш
- Комплекс хавфларни баҳолаш
- Оптимал жамоа тузилиши тавсиялари
- Асосий босқичларни аниқлаш
- Муваффақият метрикаларини белгилаш

Таҳлилингизда ҳар доим соҳа энг яхши амалиёти ва реал чекловларни ҳисобга олинг.`
  }

  return prompts[language as keyof typeof prompts] || prompts.en
}

function parseAnalysis(analysisText: string, language: string): any {
  // This is a simplified parser - in production, you might want more sophisticated parsing
  return {
    complexity: extractSection(analysisText, ['complexity', 'сложность', 'мураккаблик']),
    timeline: extractSection(analysisText, ['timeline', 'временные рамки', 'вақт жадвали']),
    milestones: extractSection(analysisText, ['milestones', 'вехи', 'босқичлар']),
    risks: extractSection(analysisText, ['risks', 'риски', 'хавфлар']),
    successMetrics: extractSection(analysisText, ['success', 'успех', 'муваффақият']),
    teamStructure: extractSection(analysisText, ['team', 'команда', 'жамоа']),
    recommendations: extractRecommendations(analysisText, language)
  }
}

function extractSection(text: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`(?:${keyword}[^\\n]*:?[\\s]*)(.*?)(?=\\n\\n|\\n[A-Z]|$)`, 'is')
    const match = text.match(regex)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return ''
}

function extractRecommendations(text: string, language: string): string[] {
  const recommendations: string[] = []
  const lines = text.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.match(/^[\d\-\*\•]/) && line.length > 10) {
      recommendations.push(line.replace(/^[\d\-\*\•]\s*/, ''))
    }
  }
  
  return recommendations.slice(0, 5) // Limit to 5 recommendations
}

function createMockAnalysis(projectName: string, category: string, priority: string, language: string): any {
  const templates = {
    en: {
      complexity: `Based on the project "${projectName}" in the ${category} category with ${priority} priority, this appears to be a medium complexity project requiring structured planning and coordinated execution.`,
      timeline: `Estimated timeline: 6-12 weeks depending on team size and resource availability. Critical path should be established early.`,
      milestones: `Key milestones: Planning phase (Week 1-2), Development/Implementation (Week 3-8), Testing/Review (Week 9-10), Deployment/Launch (Week 11-12).`,
      risks: `Primary risks include scope creep, resource constraints, and timeline pressure. Mitigation strategies should focus on clear requirements and regular progress reviews.`,
      successMetrics: `Success will be measured by on-time delivery, quality standards compliance, stakeholder satisfaction, and budget adherence.`,
      teamStructure: `Recommended team structure includes project lead, specialists based on category requirements, and quality assurance resources.`,
      recommendations: [
        'Establish clear project scope and requirements early',
        'Implement regular progress check-ins and reviews',
        'Ensure adequate resource allocation and backup plans',
        'Maintain clear communication channels with stakeholders',
        'Document decisions and changes throughout the project'
      ]
    },
    ru: {
      complexity: `На основе проекта "${projectName}" в категории ${category} с приоритетом ${priority}, это проект средней сложности, требующий структурированного планирования и координированного выполнения.`,
      timeline: `Ориентировочные сроки: 6-12 недель в зависимости от размера команды и доступности ресурсов. Критический путь должен быть установлен на раннем этапе.`,
      milestones: `Ключевые вехи: Фаза планирования (1-2 неделя), Разработка/Реализация (3-8 неделя), Тестирование/Обзор (9-10 неделя), Развертывание/Запуск (11-12 неделя).`,
      risks: `Основные риски включают расширение объема, ограничения ресурсов и давление сроков. Стратегии смягчения должны фокусироваться на четких требованиях и регулярных обзорах прогресса.`,
      successMetrics: `Успех будет измеряться своевременной доставкой, соответствием стандартам качества, удовлетворенностью заинтересованных сторон и соблюдением бюджета.`,
      teamStructure: `Рекомендуемая структура команды включает руководителя проекта, специалистов согласно требованиям категории и ресурсы обеспечения качества.`,
      recommendations: [
        'Установить четкие рамки и требования проекта на раннем этапе',
        'Внедрить регулярные проверки прогресса и обзоры',
        'Обеспечить адекватное распределение ресурсов и резервные планы',
        'Поддерживать четкие каналы связи с заинтересованными сторонами',
        'Документировать решения и изменения на протяжении проекта'
      ]
    },
    uz: {
      complexity: `"${projectName}" проекти асосида ${category} категориясида ${priority} устуворлик билан, бу тизимли режалаштириш ва мувофиқлаштирилган бажаришни талаб қиладиган ўрта мураккабликдаги проект.`,
      timeline: `Тахминий муддат: жамоа ҳажми ва ресурс мавжудлигига қараб 6-12 ҳафта. Танқидий йўл эрта белгиланиши керак.`,
      milestones: `Асосий босқичлар: Режалаштириш боскичи (1-2 ҳафта), Ишлаб чиқиш/Амалга ошириш (3-8 ҳафта), Синов/Кўриб чиқиш (9-10 ҳафта), Жойлаштириш/Ишга тушириш (11-12 ҳафта).`,
      risks: `Асосий хавфлар қамров кенгайиши, ресурс чекловлари ва муддат босимини ўз ичига олади. Енгиллаштириш стратегиялари аниқ талаблар ва мунтазам тараққиёт кўриб чиқишларига қаратилиши керак.`,
      successMetrics: `Муваффақият ўз вақтида етказиб бериш, сифат стандартларига мувофиқлик, манфаатдор томонлар қониқиши ва бюджетга риоя қилиш билан ўлчанади.`,
      teamStructure: `Тавсия этилган жамоа тузилиши проект раҳбари, категория талабларига асосланган мутахассислар ва сифатни таъминлаш ресурсларини ўз ичига олади.`,
      recommendations: [
        'Эрта босқичда аниқ проект доираси ва талабларини белгилаш',
        'Мунтазам тараққиёт текширувлари ва кўриб чиқишларни жорий этиш',
        'Етарли ресурс тақсимоти ва захира режаларни таъминлаш',
        'Манфаатдор томонлар билан аниқ алоқа каналларини сақлаш',
        'Проект давомида қарорлар ва ўзгаришларни ҳужжатлаштириш'
      ]
    }
  }

  return templates[language as keyof typeof templates] || templates.en
}
