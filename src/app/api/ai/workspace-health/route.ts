import { NextRequest, NextResponse } from 'next/server'
// import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Workspace health API called')
    
    const session = await getAuthSession(request)
    
    if (!session) {
      console.log('❌ No authentication session found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', session.user.email)

    // AI workspace health analysis temporarily disabled due to API key issues
    return NextResponse.json(
      { error: 'AI workspace health analysis temporarily unavailable' },
      { status: 503 }
    )

    // // Get workspace ID from query params
    // const { searchParams } = new URL(request.url)
    // const workspaceId = searchParams.get('workspaceId')

    // if (!workspaceId) {
    //   return NextResponse.json(
    //     { error: 'Workspace ID is required' },
    //     { status: 400 }
    //   )
    // }

    // // Get workspace with all related data
    // const workspace = await db.workspace.findUnique({
    //   where: { id: workspaceId },
    //   include: {
    //     members: {
    //       include: {
    //         user: true
    //       }
    //     },
    //     projects: {
    //       include: {
    //         tasks: {
    //           include: {
    //             assignee: true
    //           }
    //         }
    //       }
    //     }
    //   }
    // })

    // if (!workspace) {
    //   return NextResponse.json(
    //     { error: 'Workspace not found' },
    //     { status: 404 }
    //   )
    // }

    // // Check permissions - user must be admin or owner
    // const userMembership = workspace.members.find(m => m.userId === session.user.id)
    // if (!userMembership || (userMembership.role !== 'ADMIN' && userMembership.role !== 'OWNER')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions' },
    //     { status: 403 }
    //   )
    // }

    // // Calculate workspace metrics
    // const now = new Date()
    // const workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0) // 9 AM
    // const lunchStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0) // 1 PM
    // const lunchEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0) // 2 PM
    // const workEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0) // 6 PM

    // const isWorkingHours = (
    //   (now >= workStart && now < lunchStart) || 
    //   (now >= lunchEnd && now < workEnd)
    // )

    // ... [rest of the function commented out for brevity] ...

    // return NextResponse.json({
    //   workspaceData,
    //   healthReport,
    //   inactiveUsers: userActivities.filter(u => u.isInactive),
    //   breakReminders: userActivities.filter(u => u.needsBreakReminder)
    // })
  } catch (error) {
    console.error('Workspace health monitoring error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze workspace health' },
      { status: 500 }
    )
  }
}
