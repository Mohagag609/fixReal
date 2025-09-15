import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminUrl } = body

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

    // حذف جميع البيانات من الجداول
    await prisma.user.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.unit.deleteMany()
    await prisma.contract.deleteMany()
    await prisma.voucher.deleteMany()
    await prisma.installment.deleteMany()
    await prisma.safe.deleteMany()
    await prisma.transfer.deleteMany()
    await prisma.partner.deleteMany()
    await prisma.unitPartner.deleteMany()
    await prisma.partnerDebt.deleteMany()
    await prisma.broker.deleteMany()
    await prisma.brokerDue.deleteMany()
    await prisma.partnerGroup.deleteMany()
    await prisma.partnerGroupPartner.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.keyVal.deleteMany()
    await prisma.notification.deleteMany()

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'تم مسح جميع البيانات بنجاح',
      logout: true,
      redirect: '/setup'
    })

  } catch (error) {
    console.error('Wipe error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في مسح البيانات',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}
