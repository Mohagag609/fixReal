import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getSoftDeletedEntities } from '@/lib/soft-delete'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/trash - Get soft deleted entities
export async function GET(request: NextRequest) {
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

    const deletedEntities = await getSoftDeletedEntities(entityType, page, limit)

    const response: PaginatedResponse<unknown> = {
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