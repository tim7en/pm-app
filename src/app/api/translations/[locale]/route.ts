import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  try {
    const { locale } = await params
    const filePath = join(process.cwd(), 'public', 'locales', locale, 'common.json')
    
    const fileContent = readFileSync(filePath, 'utf8')
    const translations = JSON.parse(fileContent)
    
    return NextResponse.json(translations)
  } catch (error) {
    console.error('Error loading translation file:', error)
    return NextResponse.json(
      { error: 'Translation file not found' },
      { status: 404 }
    )
  }
}
