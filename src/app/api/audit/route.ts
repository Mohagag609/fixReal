import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getAuditLogs } from '@/lib/audit'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/audit - Get audit logs with pagination
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
    const action = searchParams.get('action') || ''
    const entityType = searchParams.get('entityType') || ''
    const entityId = searchParams.get('entityId') || ''
    const userId = searchParams.get('userId') || ''
    const fromDate = searchParams.get('fromDate') || ''
    const toDate = searchParams.get('toDate') || ''

    const filters: any = {}
    if (action) filters.action = action
    if (entityType) filters.entityType = entityType
    if (entityId) filters.entityId = entityId
    if (userId) filters.userId = userId
    if (fromDate) filters.fromDate = fromDate
    if (toDate) filters.toDate = toDate

    const auditLogs = await getAuditLogs(page, limit, filters)

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
    console.error('Error getting audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}