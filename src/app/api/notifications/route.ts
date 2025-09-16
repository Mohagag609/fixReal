import { NextRequest, NextResponse } from 'next/server'
import { getNotifications } from '@/lib/notifications'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/notifications - Get notifications with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get notifications
    const notifications = await getNotifications(page)

    const response: PaginatedResponse<unknown> = {
      success: true,
      data: notifications.data || [],
      pagination: {
        limit,
        nextCursor: null,
        hasMore: (notifications.data || []).length === limit
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error getting notifications:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحميل الإشعارات' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, type, userId } = body

    if (!title || !message || !type) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    // Create notification logic would go here
    const notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      userId,
      acknowledged: false,
      createdAt: new Date().toISOString()
    }

    const response: ApiResponse<unknown> = {
      success: true,
      data: notification,
      message: 'تم إنشاء الإشعار بنجاح'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في إنشاء الإشعار' },
      { status: 500 }
    )
  }
}