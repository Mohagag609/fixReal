import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getCachedUser } from '@/lib/cached-auth'
import { softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Installment } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/installments/[id] - Get installment by ID
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

    const installment = await prisma.installment.findUnique({
      where: { id: params.id },
      include: {
        unit: true
      }
    })

    if (!installment) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Installment> = {
      success: true,
      data: installment
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

// PUT /api/installments/[id] - Update installment
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

    const body = await request.json()
    const { unitId, amount, dueDate, status, notes } = body

    // Check if installment exists
    const existingInstallment = await prisma.installment.findUnique({
      where: { id: params.id }
    })

    if (!existingInstallment) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Prepare update data - only update provided fields
    const updateData: any = {}
    
    if (unitId !== undefined) {
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
      updateData.unitId = unitId
    }

    if (amount !== undefined) {
      if (amount <= 0) {
        await prisma.$disconnect()

    return NextResponse.json(
          { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
          { status: 400 }
        )
      }
      updateData.amount = amount
    }

    if (dueDate !== undefined) {
      updateData.dueDate = new Date(dueDate)
    }

    if (status !== undefined) {
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update installment
    const installment = await prisma.installment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        unit: true
      }
    })

    const response: ApiResponse<Installment> = {
      success: true,
      data: installment,
      message: 'تم تحديث القسط بنجاح'
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

// DELETE /api/installments/[id] - Delete installment
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

    // Soft delete installment
    const result = await softDeleteEntity('installment', params.id, user.id.toString())
    
    if (!result.success) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف القسط بنجاح'
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