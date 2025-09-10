import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getNotifications, getUnacknowledgedCount } from '@/lib/notifications'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/notifications - Get notifications with pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const acknowledged = searchParams.get('acknowledged')

    const filters: any = {}
    if (type) filters.type = type
    if (category) filters.category = category
    if (acknowledged !== null) filters.acknowledged = acknowledged === 'true'

    const notifications = await getNotifications(page, limit, filters)

    const response: PaginatedResponse<any> = {
      success: true,
      data: notifications.data,
      pagination: {
        page,
        limit,
        total: notifications.total,
        totalPages: notifications.totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting notifications:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// GET /api/notifications/count - Get unacknowledged notifications count
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const count = await getUnacknowledgedCount()

    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count },
      message: 'تم تحميل عدد الإشعارات بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting notifications count:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}