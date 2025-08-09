import { NextRequest, NextResponse } from 'next/server'

// Use direct Prisma import to avoid db.ts complications
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test registration endpoint called')
    const body = await request.json()
    const { email, password, name } = body

    console.log('📝 Received data:', { email, name, passwordLength: password?.length })

    if (!email || !password || !name) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking if user exists...')
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      console.log('❌ User already exists')
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    console.log('🔐 Hashing password...')
    // Simple hash for testing (don't use in production)
    const hashedPassword = password + '_hashed'

    console.log('👤 Creating user...')
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword
      }
    })

    console.log('✅ User created successfully:', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Test registration error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to register user',
        details: errorMessage 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
