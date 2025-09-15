import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getCachedUser } from '@/lib/cached-auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/partner-debts/[id]/pay - Mark debt as paid
export async function POST(
  request: NextRequest,
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

    const debtId = params.id

    // Check if debt exists
    const existingDebt = await prisma.partnerDebt.findUnique({
      where: { id: debtId }
    })

    if (!existingDebt) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'دين الشريك غير موجود' },
        { status: 404 }
      )
    }

    if (existingDebt.status === 'مدفوع') {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'هذا الدين مدفوع بالفعل' },
        { status: 400 }
      )
    }

    // Update debt status to paid
    await prisma.partnerDebt.update({
      where: { id: debtId },
      data: { 
        status: 'مدفوع',
        updatedAt: new Date()
      }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم تسجيل سداد الدين بنجاح'
    }

    await prisma.$disconnect()

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error paying debt:', error)
    await prisma.$disconnect()

    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}