import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const voucherSchema = z.object({
  type: z.enum(['receipt', 'payment'], { message: 'نوع الشيك مطلوب' }),
  date: z.string().transform((str) => new Date(str)),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  safeId: z.string().min(1, 'الخزينة مطلوبة'),
  description: z.string().min(1, 'الوصف مطلوب'),
  payer: z.string().optional(),
  beneficiary: z.string().optional(),
  linkedRef: z.string().optional(),
})

// GET /api/vouchers - Get all vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const safeId = searchParams.get('safeId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { description: { contains: search } },
          { payer: { contains: search } },
          { beneficiary: { contains: search } },
        ],
      }),
      ...(type && { type }),
      ...(safeId && { safeId }),
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          safe: {
            select: { name: true },
          },
          unit: {
            select: { code: true, name: true },
          },
        },
      }),
      prisma.voucher.count({ where }),
    ])

    return NextResponse.json({
      data: vouchers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الشيكات' },
      { status: 500 }
    )
  }
}

// POST /api/vouchers - Create new voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = voucherSchema.parse(body)

    // Check if safe exists
    const safe = await prisma.safe.findFirst({
      where: { id: validatedData.safeId, deletedAt: null },
    })

    if (!safe) {
      return NextResponse.json(
        { error: 'الخزينة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if unit exists (if linkedRef is provided)
    if (validatedData.linkedRef) {
      const unit = await prisma.unit.findFirst({
        where: { id: validatedData.linkedRef, deletedAt: null },
      })

      if (!unit) {
        return NextResponse.json(
          { error: 'الوحدة غير موجودة' },
          { status: 404 }
        )
      }
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: validatedData,
      include: {
        safe: {
          select: { name: true },
        },
        unit: {
          select: { code: true, name: true },
        },
      },
    })

    // Update safe balance
    const balanceChange = validatedData.type === 'receipt' 
      ? validatedData.amount 
      : -validatedData.amount

    await prisma.safe.update({
      where: { id: validatedData.safeId },
      data: { balance: { increment: balanceChange } },
    })

    return NextResponse.json(voucher, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الشيك' },
      { status: 500 }
    )
  }
}