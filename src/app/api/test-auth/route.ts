import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth test API called')
    
    const session = await getAuthSession(request)
    
    if (!session) {
      console.log('❌ No authentication session found')
      return NextResponse.json(
        { 
          error: 'Authentication required',
          hasAuthHeader: !!request.headers.get('authorization'),
          hasCookie: !!request.cookies.get('auth-token')
        },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', session.user.email)
    
    return NextResponse.json({
      success: true,
      user: session.user,
      message: 'Authentication working'
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
