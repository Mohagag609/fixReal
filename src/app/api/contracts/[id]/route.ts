import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getCachedUser } from '@/lib/cached-auth'
import { validateContract } from '@/utils/validation'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Contract } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/contracts/[id] - Get contract by ID
export async function GET(
  _request: NextRequest,
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

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: true,
        customer: true
      }
    })

    if (!contract) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Contract> = {
      success: true,
      data: contract
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

// PUT /api/contracts/[id] - Update contract
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
    const { unitId, customerId, start, totalPrice, discountAmount, brokerName, commissionSafeId, brokerAmount } = body

    // Validate contract data
    const validation = validateContract({ unitId, customerId, start, totalPrice, discountAmount })
    if (!validation.isValid) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id: params.id }
    })

    if (!existingContract) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
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

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 400 }
      )
    }

    // Update contract
    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        unitId,
        customerId,
        start: new Date(start),
        totalPrice,
        discountAmount,
        brokerName,
        commissionSafeId,
        brokerAmount
      },
      include: {
        unit: true,
        customer: true
      }
    })

    const response: ApiResponse<Contract> = {
      success: true,
      data: contract,
      message: 'تم تحديث العقد بنجاح'
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

// DELETE /api/contracts/[id] - Delete contract
export async function DELETE(
  _request: NextRequest,
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

    // Check if contract can be deleted
    const canDelete = await canDeleteEntity('contract', params.id)
    if (!canDelete.canDelete) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Get contract to update unit status
    const contract = await prisma.contract.findUnique({
      where: { id: params.id }
    })

    if (!contract) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // Soft delete contract
    const result = await softDeleteEntity('contract', params.id, 'system')
    
    if (!result.success) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    // Update unit status back to available
    await prisma.unit.update({
      where: { id: contract.unitId },
      data: { status: 'متاحة' }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف العقد بنجاح'
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