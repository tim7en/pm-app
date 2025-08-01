import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const locales = ['en', 'ru', 'uz']
    const result: any = {}
    
    for (const locale of locales) {
      try {
        const filePath = join(process.cwd(), 'public', 'locales', locale, 'common.json')
        const fileContent = readFileSync(filePath, 'utf8')
        const translations = JSON.parse(fileContent)
        
        result[locale] = {
          available: true,
          topLevelKeys: Object.keys(translations),
          hasProjects: !!translations.projects,
          projectKeys: translations.projects ? Object.keys(translations.projects).slice(0, 10) : [],
          sampleProjectTranslations: translations.projects ? {
            creator: translations.projects.creator,
            progress: translations.projects.progress,
            of: translations.projects.of,
            tasks: translations.projects.tasks,
            complete: translations.projects.complete,
            active: translations.projects.active,
            archived: translations.projects.archived,
            completed: translations.projects.completed
          } : {}
        }
      } catch (error) {
        result[locale] = {
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      locales: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
