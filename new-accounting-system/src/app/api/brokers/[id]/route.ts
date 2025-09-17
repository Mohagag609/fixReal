import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  // Return empty array for static generation
  return [];
}

const brokerSchema = z.object({
  name: z.string().min(1, 'اسم الوسيط مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/brokers/[id] - Get broker by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const broker = await prisma.broker.findFirst({
      where: { id, deletedAt: null },
      include: {
        brokerDues: {
          where: { deletedAt: null },
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    if (!broker) {
      return NextResponse.json(
        { error: 'الوسيط غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(broker)
  } catch (error) {
    console.error('Error fetching broker:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الوسيط' },
      { status: 500 }
    )
  }
}

// PUT /api/brokers/[id] - Update broker
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = brokerSchema.parse(body)

    // Check if broker exists
    const existingBroker = await prisma.broker.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existingBroker) {
      return NextResponse.json(
        { error: 'الوسيط غير موجود' },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current broker)
    const duplicateBroker = await prisma.broker.findFirst({
      where: { 
        name: validatedData.name, 
        deletedAt: null,
        id: { not: id }
      },
    })
    if (duplicateBroker) {
      return NextResponse.json(
        { error: 'اسم الوسيط موجود بالفعل' },
        { status: 400 }
      )
    }

    const broker = await prisma.broker.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(broker)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating broker:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث الوسيط' },
      { status: 500 }
    )
  }
}

// DELETE /api/brokers/[id] - Soft delete broker
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const broker = await prisma.broker.findFirst({
      where: { id, deletedAt: null },
    })

    if (!broker) {
      return NextResponse.json(
        { error: 'الوسيط غير موجود' },
        { status: 404 }
      )
    }

    // Check if broker has active dues
    const activeDues = await prisma.brokerDue.count({
      where: { brokerId: id, deletedAt: null },
    })

    if (activeDues > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الوسيط لوجود ديون مرتبطة' },
        { status: 400 }
      )
    }

    await prisma.broker.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'تم حذف الوسيط بنجاح' })
  } catch (error) {
    console.error('Error deleting broker:', error)
    return NextResponse.json(
      { error: 'فشل في حذف الوسيط' },
      { status: 500 }
    )
  }
}