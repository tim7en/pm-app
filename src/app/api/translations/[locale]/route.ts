import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const resolvedParams = await params
    console.log('Translation API called with params:', params)
    const { locale } = await params
    console.log('Resolved locale:', locale)
    
    const filePath = join(process.cwd(), 'public', 'locales', locale, 'common.json')
    console.log('Looking for translation file at:', filePath)
    
    const fileContent = readFileSync(filePath, 'utf8')
    const translations = JSON.parse(fileContent)
    
    console.log('Successfully loaded translations for', locale, 'with', Object.keys(translations).length, 'top-level keys')
    return NextResponse.json(translations)
  } catch (error) {
    console.error('Error loading translation file:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Translation file not found', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    )
  }
}
