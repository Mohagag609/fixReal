import { NextRequest, NextResponse } from 'next/server'
import { acknowledgeNotification } from '@/lib/notifications'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/notifications/[id]/acknowledge - Acknowledge notification
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الإشعار مطلوب' },
        { status: 400 }
      )
    }

    // Acknowledge notification
    const result = await acknowledgeNotification(id, 'user')

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'فشل في تأكيد الإشعار' },
        { status: 500 }
      )
    }

    const response: ApiResponse<{ acknowledged: boolean }> = {
      success: true,
      data: { acknowledged: true },
      message: 'تم تأكيد الإشعار بنجاح'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error acknowledging notification:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تأكيد الإشعار' },
      { status: 500 }
    )
  }
}