import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/unit-partner-groups - Link unit to partner group
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { unitId, partnerGroupId } = body

    // Validation
    if (!unitId || !partnerGroupId) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'معرف الوحدة ومعرف مجموعة الشركاء مطلوبان' },
        { status: 400 }
      )
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    })

    if (!unit) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    // Check if partner group exists
    const partnerGroup = await prisma.partnerGroup.findUnique({
      where: { id: partnerGroupId },
      include: {
        partners: true
      }
    })

    if (!partnerGroup) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'مجموعة الشركاء غير موجودة' },
        { status: 400 }
      )
    }

    // Check if unit is already linked to a partner group
    const existingLink = await prisma.unitPartnerGroup.findFirst({
      where: { unitId, deletedAt: null }
    })

    if (existingLink) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'هذه الوحدة مرتبطة بالفعل بمجموعة شركاء أخرى' },
        { status: 400 }
      )
    }

    // Start transaction to link unit to partner group and create unit partners
    const result = await prisma.$transaction(async (tx) => {
      // Create unit-partner-group link
      const unitPartnerGroup = await tx.unitPartnerGroup.create({
        data: {
          unitId,
          partnerGroupId
        }
      })

      // Create unit partners for each partner in the group
      const unitPartners = []
      for (const groupPartner of partnerGroup.partners) {
        const unitPartner = await tx.unitPartner.create({
          data: {
            unitId,
            partnerId: groupPartner.partnerId,
            percentage: groupPartner.percentage
          }
        })
        unitPartners.push(unitPartner)
      }

      return { unitPartnerGroup, unitPartners }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      data: result,
      message: `تم ربط الوحدة بمجموعة الشركاء بنجاح. تم إنشاء ${result.unitPartners.length} ربط شريك.`
    })
  } catch (error) {
    console.error('Error linking unit to partner group:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }

    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// GET /api/unit-partner-groups - Get unit partner groups
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')

    const whereClause: Record<string, unknown> = { deletedAt: null }

    if (unitId) {
      whereClause.unitId = unitId
    }

    const unitPartnerGroups = await prisma.unitPartnerGroup.findMany({
      where: whereClause,
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            name: true,
            unitType: true,
            status: true
          }
        },
        partnerGroup: {
          select: {
            id: true,
            name: true,
            notes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      data: unitPartnerGroups
    })
  } catch (error) {
    console.error('Error getting unit partner groups:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }

    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

