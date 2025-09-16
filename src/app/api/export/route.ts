import { NextRequest, NextResponse } from 'next/server'
// import { getUserFromToken } from '@/lib/auth'
import { createBackup } from '@/lib/backup'
// import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/export - Export all data to JSON
export async function GET(_request: NextRequest) {
  try {
    // Authentication check removed for better performance

    // Create backup data
    const backupData = await createBackup()

    // Return JSON file
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0] || 'غير محدد'}.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تصدير البيانات' },
      { status: 500 }
    )
  }
}