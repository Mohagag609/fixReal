import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { restoreBackup, validateBackupData } from '@/lib/backup'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/import - Import data from JSON
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

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'البيانات مطلوبة' },
        { status: 400 }
      )
    }

    // Validate backup data
    const validation = validateBackupData(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: `بيانات غير صحيحة: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Restore backup
    const result = await restoreBackup(data)

    const response: ApiResponse = {
      success: result.success,
      message: result.message
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في استيراد البيانات' },
      { status: 500 }
    )
  }
}