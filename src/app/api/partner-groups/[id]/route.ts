import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const groupId = params.id

    // Get group with partners
    const group = await prisma.partnerGroup.findUnique({
      where: { id: groupId },
      include: {
        partners: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      await prisma.$disconnect()
      return NextResponse.json({ success: false, error: 'المجموعة غير موجودة' }, { status: 404 })
    }

    // Transform the data
    const transformedGroup = {
      id: group.id,
      name: group.name,
      notes: group.notes,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      partners: group.partners.map(p => ({
        partnerId: p.partnerId,
        percentage: p.percentage,
        partner: p.partner
      }))
    }

    await prisma.$disconnect()

    return NextResponse.json(transformedGroup)
  } catch (error) {
    console.error('Error fetching partner group:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }

    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const groupId = params.id

    // Delete group and all related partners
    await prisma.partnerGroupPartner.deleteMany({
      where: { partnerGroupId: groupId }
    })

    await prisma.partnerGroup.delete({
      where: { id: groupId }
    })

    await prisma.$disconnect()

    return NextResponse.json({ success: true, message: 'تم حذف المجموعة بنجاح' })
  } catch (error) {
    console.error('Error deleting partner group:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }

    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

