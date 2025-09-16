import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/partner-debts/[id]/pay - Pay partner debt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient(config)

    // Get partner debt
    const partnerDebt = await prisma.partnerDebt.findUnique({
      where: { id },
      include: {
        partner: true
      }
    })

    if (!partnerDebt) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'دين الشريك غير موجود' },
        { status: 404 }
      )
    }

    if (partnerDebt.status === 'paid') {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'تم دفع هذا الدين مسبقاً' },
        { status: 400 }
      )
    }

    // Update partner debt
    const updatedDebt = await prisma.partnerDebt.update({
      where: { id },
      data: {
        status: 'paid',
        // paidDate: paymentDate ? new Date(paymentDate) : new Date(),
        // notes: notes || ''
      },
      include: {
        partner: true
      }
    })

    await prisma.$disconnect()

    const response: ApiResponse<unknown> = {
      success: true,
      data: updatedDebt,
      message: 'تم دفع دين الشريك بنجاح'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error paying partner debt:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في دفع دين الشريك' },
      { status: 500 }
    )
  }
}