import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getCachedUser } from '@/lib/cached-auth'
import { ApiResponse, Partner } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/partners/[id] - Get partner by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    
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

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getCachedUser(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const partnerId = params.id

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        unitPartners: {
          where: { deletedAt: null },
          include: {
            unit: true
          }
        },
        partnerDebts: {
          where: { deletedAt: null }
        }
      }
    })

    if (!partner) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Partner> = {
      success: true,
      data: partner
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

// PUT /api/partners/[id] - Update partner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    
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

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getCachedUser(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const partnerId = params.id
    const body = await request.json()
    const { name, phone, notes } = body

    // Validation
    if (!name) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'اسم الشريك مطلوب' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!existingPartner) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    // Update partner
    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        name,
        phone,
        notes
      }
    })

    const response: ApiResponse<Partner> = {
      success: true,
      data: partner,
      message: 'تم تحديث بيانات الشريك بنجاح'
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

// DELETE /api/partners/[id] - Delete partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    
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

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getCachedUser(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const partnerId = params.id

    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!existingPartner) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    // Check if partner is linked to any units
    const unitPartners = await prisma.unitPartner.findMany({
      where: { partnerId, deletedAt: null }
    })

    if (unitPartners.length > 0) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الشريك لأنه مرتبط بوحدات' },
        { status: 400 }
      )
    }

    // Soft delete partner
    await prisma.partner.update({
      where: { id: partnerId },
      data: { deletedAt: new Date() }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف الشريك بنجاح'
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