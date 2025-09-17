import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  // Return empty array for static generation
  return [];
}

const partnerSchema = z.object({
  name: z.string().min(1, 'اسم الشريك مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/partners/[id] - Get partner by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const partner = await prisma.partner.findFirst({
      where: { id: id, deletedAt: null },
      include: {
        unitPartners: {
          where: { deletedAt: null },
          include: {
            unit: {
              select: { code: true, name: true, totalPrice: true },
            },
          },
        },
        partnerDebts: {
          where: { deletedAt: null },
          orderBy: { dueDate: 'asc' },
        },
        partnerGroupPartners: {
          where: { deletedAt: null },
          include: {
            partnerGroup: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(partner)
  } catch (error) {
    console.error('Error fetching partner:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الشريك' },
      { status: 500 }
    )
  }
}

// PUT /api/partners/[id] - Update partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = partnerSchema.parse(body)

    // Check if partner exists
    const existingPartner = await prisma.partner.findFirst({
      where: { id: id, deletedAt: null },
    })

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    // Filter out undefined values to satisfy Prisma's exactOptionalPropertyTypes
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined)
    )

    const partner = await prisma.partner.update({
      where: { id: id },
      data: updateData,
    })

    return NextResponse.json(partner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating partner:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث الشريك' },
      { status: 500 }
    )
  }
}

// DELETE /api/partners/[id] - Soft delete partner
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const partner = await prisma.partner.findFirst({
      where: { id: id, deletedAt: null },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    // Check if partner has active unit partnerships
    const activeUnitPartners = await prisma.unitPartner.count({
      where: { partnerId: id, deletedAt: null },
    })

    if (activeUnitPartners > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الشريك لوجود وحدات مرتبطة' },
        { status: 400 }
      )
    }

    await prisma.partner.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'تم حذف الشريك بنجاح' })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json(
      { error: 'فشل في حذف الشريك' },
      { status: 500 }
    )
  }
}