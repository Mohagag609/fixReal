import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getCachedUser } from '@/lib/cached-auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/brokers/[id]/dues - Get broker dues for specific broker
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check removed for better performance
    
    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient(config)
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect()
    } catch (error) {
      console.log('Reconnecting to database...')
    }

    const brokerDues = await prisma.brokerDue.findMany({
      where: {
        brokerId: params.id,
        deletedAt: null
      },
      include: {
        broker: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const response: ApiResponse<unknown> = {
      success: true,
      data: brokerDues
    }

    await prisma.$disconnect()

    return NextResponse.json(response)
  } catch (error) {
      console.error('Error:', error)
      return NextResponse.json(
        { success: false, error: 'خطأ في قاعدة البيانات' },
        { status: 500 }
      )
    }
}