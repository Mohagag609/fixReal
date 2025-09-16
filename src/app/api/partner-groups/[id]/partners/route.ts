import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getCachedUser } from '@/lib/cached-auth'

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

    const { partnerId, percent } = await request.json()
    const groupId = params.id

    if (!partnerId || !percent || percent <= 0) {
      await prisma.$disconnect()

    return NextResponse.json({ success: false, error: 'بيانات غير صحيحة' }, { status: 400 })
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      await prisma.$disconnect()

    return NextResponse.json({ success: false, error: 'الشريك غير موجود' }, { status: 404 })
    }

    // Check if group exists
    const group = await prisma.partnerGroup.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      await prisma.$disconnect()

    return NextResponse.json({ success: false, error: 'المجموعة غير موجودة' }, { status: 404 })
    }

    // Check if partner is already in the group
    const existingPartner = await prisma.partnerGroupPartner.findFirst({
      where: {
        partnerGroupId: groupId,
        partnerId: partnerId
      }
    })

    if (existingPartner) {
      await prisma.$disconnect()

    return NextResponse.json({ success: false, error: 'الشريك موجود بالفعل في هذه المجموعة' }, { status: 400 })
    }

    // Check total percentage
    const currentTotal = await prisma.partnerGroupPartner.aggregate({
      where: { partnerGroupId: groupId },
      _sum: { percentage: true }
    })

    const currentTotalPercent = currentTotal._sum.percentage || 0
    if (currentTotalPercent + percent > 100) {
      await prisma.$disconnect()

    return NextResponse.json({ 
        success: false, 
        error: `لا يمكن إضافة هذه النسبة. الإجمالي الحالي هو ${currentTotalPercent}%. إضافة ${percent}% سيجعل المجموع يتجاوز 100%.` 
      }, { status: 400 })
    }

    // Add partner to group
    await prisma.partnerGroupPartner.create({
      data: {
        partnerGroupId: groupId,
        partnerId: partnerId,
        percentage: percent
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({ success: true, message: 'تم إضافة الشريك للمجموعة بنجاح' })
  } catch (error) {
      console.error('Error:', error)
      return NextResponse.json(
        { success: false, error: 'خطأ في قاعدة البيانات' },
        { status: 500 }
      )
    }
}