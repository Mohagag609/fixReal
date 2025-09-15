import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getCachedUser } from '@/lib/cached-auth'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Broker } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/brokers/[id] - Get broker by ID
export async function GET(
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

    const broker = await prisma.broker.findUnique({
      where: { id: params.id },
      include: {
        brokerDues: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!broker) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'السمسار غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Broker> = {
      success: true,
      data: broker
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

// PUT /api/brokers/[id] - Update broker
export async function PUT(
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

    const body = await request.json()
    const { name, phone, notes } = body

    // Validation
    if (!name) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'اسم السمسار مطلوب' },
        { status: 400 }
      )
    }

    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id: params.id }
    })

    if (!existingBroker) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'السمسار غير موجود' },
        { status: 404 }
      )
    }

    // Check if broker name already exists for another broker
    if (name !== existingBroker.name) {
      const nameExists = await prisma.broker.findUnique({
        where: { name }
      })

      if (nameExists) {
        await prisma.$disconnect()

    return NextResponse.json(
          { success: false, error: 'اسم السمسار مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update broker
    const broker = await prisma.broker.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        notes
      }
    })

    const response: ApiResponse<Broker> = {
      success: true,
      data: broker,
      message: 'تم تحديث السمسار بنجاح'
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

// DELETE /api/brokers/[id] - Delete broker
export async function DELETE(
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

    // Check if broker can be deleted
    const canDelete = await canDeleteEntity('broker', params.id)
    if (!canDelete.canDelete) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete broker
    const result = await softDeleteEntity('broker', params.id, 'system')
    
    if (!result.success) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف السمسار بنجاح'
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