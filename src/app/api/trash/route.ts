import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getSoftDeletedEntities } from '@/lib/soft-delete'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/trash - Get soft deleted entities
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
    const entityType = searchParams.get('entityType') || ''

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: 'نوع الكيان مطلوب' },
        { status: 400 }
      )
    }

    const deletedEntities = await getSoftDeletedEntities(entityType, page, limit)

    const response: PaginatedResponse<any> = {
      success: true,
      data: deletedEntities.data,
      pagination: {
        page,
        limit,
        total: deletedEntities.total,
        totalPages: deletedEntities.totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting soft deleted entities:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}