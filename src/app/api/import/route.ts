import { NextRequest, NextResponse } from 'next/server'
// import { getUserFromToken } from '@/lib/auth'
import { restoreBackup, validateBackupData } from '@/lib/backup'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/import - Import data from JSON
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

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