import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getEntityAuditLogs } from '@/lib/audit'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/audit/[id] - Get audit logs for specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 403 }
      )
    }

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

    const response: PaginatedResponse<any> = {
      success: true,
      data: auditLogs.data,
      pagination: {
        page,
        limit,
        total: auditLogs.total,
        totalPages: auditLogs.totalPages
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