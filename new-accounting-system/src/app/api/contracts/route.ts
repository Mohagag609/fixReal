import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const contractSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  customerId: z.string().min(1, 'العميل مطلوب'),
  start: z.string().transform((str) => new Date(str)),
  totalPrice: z.number().min(0, 'السعر الإجمالي يجب أن يكون أكبر من أو يساوي صفر'),
  discountAmount: z.number().min(0).default(0),
  brokerName: z.string().optional(),
  brokerPercent: z.number().min(0).max(100).default(0),
  brokerAmount: z.number().min(0).default(0),
  commissionSafeId: z.string().optional(),
  downPaymentSafeId: z.string().optional(),
  maintenanceDeposit: z.number().min(0).default(0),
  installmentType: z.string().default('شهري'),
  installmentCount: z.number().min(0).default(0),
  extraAnnual: z.number().min(0).default(0),
  annualPaymentValue: z.number().min(0).default(0),
  downPayment: z.number().min(0).default(0),
  paymentType: z.string().default('installment'),
})

// GET /api/contracts - Get all contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId') || ''
    const unitId = searchParams.get('unitId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { brokerName: { contains: search } },
          { unit: { code: { contains: search } } },
          { unit: { name: { contains: search } } },
          { customer: { name: { contains: search } } },
        ],
      }),
      ...(customerId && { customerId }),
      ...(unitId && { unitId }),
      ...(startDate && { start: { gte: new Date(startDate) } }),
      ...(endDate && { start: { lte: new Date(endDate) } }),
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: {
            select: { code: true, name: true, totalPrice: true, status: true },
          },
          customer: {
            select: { name: true, phone: true, nationalId: true },
          },
        },
      }),
      prisma.contract.count({ where }),
    ])

    return NextResponse.json({
      data: contracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'فشل في جلب العقود' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = contractSchema.parse(body)

    // Check if unit exists and is available
    const unit = await prisma.unit.findFirst({
      where: { id: validatedData.unitId, deletedAt: null },
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    if (unit.status !== 'متاحة') {
      return NextResponse.json(
        { error: 'الوحدة غير متاحة للعقد' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: validatedData.customerId, deletedAt: null },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Filter out undefined values to satisfy Prisma's exactOptionalPropertyTypes
    const createData = {
      unitId: validatedData.unitId,
      customerId: validatedData.customerId,
      start: validatedData.start,
      totalPrice: validatedData.totalPrice,
      discountAmount: validatedData.discountAmount,
      brokerPercent: validatedData.brokerPercent,
      brokerAmount: validatedData.brokerAmount,
      maintenanceDeposit: validatedData.maintenanceDeposit,
      installmentType: validatedData.installmentType,
      installmentCount: validatedData.installmentCount,
      extraAnnual: validatedData.extraAnnual,
      annualPaymentValue: validatedData.annualPaymentValue,
      downPayment: validatedData.downPayment,
      paymentType: validatedData.paymentType,
      ...(validatedData.brokerName !== undefined && { brokerName: validatedData.brokerName }),
      ...(validatedData.commissionSafeId !== undefined && { commissionSafeId: validatedData.commissionSafeId }),
      ...(validatedData.downPaymentSafeId !== undefined && { downPaymentSafeId: validatedData.downPaymentSafeId }),
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: createData,
      include: {
        unit: {
          select: { code: true, name: true, totalPrice: true },
        },
        customer: {
          select: { name: true, phone: true },
        },
      },
    })

    // Update unit status to 'مباعة'
    await prisma.unit.update({
      where: { id: validatedData.unitId },
      data: { status: 'مباعة' },
    })

    // Create installments if payment type is installment
    if (validatedData.paymentType === 'installment' && validatedData.installmentCount > 0) {
      const installmentAmount = (validatedData.totalPrice - validatedData.discountAmount - validatedData.downPayment) / validatedData.installmentCount
      
      for (let i = 0; i < validatedData.installmentCount; i++) {
        const dueDate = new Date(validatedData.start)
        dueDate.setMonth(dueDate.getMonth() + i)
        
        await prisma.installment.create({
          data: {
            unitId: validatedData.unitId,
            amount: installmentAmount,
            dueDate,
            status: 'معلق',
          },
        })
      }
    }

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء العقد' },
      { status: 500 }
    )
  }
}