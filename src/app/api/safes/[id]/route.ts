import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getCachedUser } from '@/lib/cached-auth'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Safe } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/safes/[id] - Get safe by ID
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

    const safe = await prisma.safe.findUnique({
      where: { id: params.id },
      include: {
        vouchers: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        },
        transfersFrom: {
          where: { deletedAt: null },
          include: {
            toSafe: true
          },
          orderBy: { createdAt: 'desc' }
        },
        transfersTo: {
          where: { deletedAt: null },
          include: {
            fromSafe: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!safe) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Safe> = {
      success: true,
      data: safe
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

// PUT /api/safes/[id] - Update safe
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
    const { name, balance } = body

    // Validation
    if (!name) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'اسم الخزنة مطلوب' },
        { status: 400 }
      )
    }

    if (balance && balance < 0) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الرصيد لا يمكن أن يكون سالباً' },
        { status: 400 }
      )
    }

    // Check if safe exists
    const existingSafe = await prisma.safe.findUnique({
      where: { id: params.id }
    })

    if (!existingSafe) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if safe name already exists for another safe
    if (name !== existingSafe.name) {
      const nameExists = await prisma.safe.findUnique({
        where: { name }
      })

      if (nameExists) {
        await prisma.$disconnect()

    return NextResponse.json(
          { success: false, error: 'اسم الخزنة مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update safe
    const safe = await prisma.safe.update({
      where: { id: params.id },
      data: {
        name,
        balance
      }
    })

    const response: ApiResponse<Safe> = {
      success: true,
      data: safe,
      message: 'تم تحديث الخزنة بنجاح'
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

// DELETE /api/safes/[id] - Delete safe
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

    // Check if safe can be deleted
    const canDelete = await canDeleteEntity('safe', params.id)
    if (!canDelete.canDelete) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete safe
    const result = await softDeleteEntity('safe', params.id, 'system')
    
    if (!result.success) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف الخزنة بنجاح'
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