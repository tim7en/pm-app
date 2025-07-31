import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data, filtering out sensitive fields
    const { password, ...userData } = user
    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
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
      name, 
      company, 
      position, 
      phone, 
      location, 
      bio, 
      timezone, 
      language 
    } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        ...(company !== undefined && { company: company?.trim() || null }),
        ...(position !== undefined && { position: position?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(timezone !== undefined && { timezone: timezone?.trim() || null }),
        ...(language !== undefined && { language: language?.trim() || null }),
      }
    })

    // Filter out sensitive data
    const { password, ...userResponse } = updatedUser

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userResponse
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
