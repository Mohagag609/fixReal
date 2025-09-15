import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { acknowledgeNotification } from '@/lib/notifications'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/notifications/[id]/acknowledge - Acknowledge notification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check removed for better performance

    // Acknowledge notification
    const result = await acknowledgeNotification(params.id, user.id.toString())

    const response: ApiResponse = {
      success: result.success,
      message: result.message
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error acknowledging notification:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}