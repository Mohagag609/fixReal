import { NextRequest, NextResponse } from 'next/server'
// import { getUserFromToken } from '@/lib/auth'
import { getEntityAuditLogs } from '@/lib/audit'
import { PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/audit/[id] - Get audit logs for specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check removed for better performance

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const entityType = searchParams.get('entityType') || ''

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: 'نوع الكيان مطلوب' },
        { status: 400 }
      )
    }

    const auditLogs = await getEntityAuditLogs(entityType, params.id, page, limit)

    const response: PaginatedResponse<unknown> = {
      success: true,
      data: auditLogs.data,
      pagination: {
        limit,
        nextCursor: null,
        hasMore: false
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting entity audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}