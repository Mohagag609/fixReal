import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { validateContract } from '@/utils/validation'
import { cache as cacheClient, CacheKeys, CacheTTL } from '@/lib/cache/redis'
import { ApiResponse, Contract, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/contracts - Get contracts with pagination
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''

    // Create cache key based on parameters
    const cacheKey = CacheKeys.entityList('contracts', `limit:${limit},cursor:${cursor || 'null'},search:${search}`)
    
    // Try to get cached data first (with error handling)
    let cachedData = null
    try {
      cachedData = await cacheClient.get<PaginatedResponse<Contract>>(cacheKey)
      if (cachedData) {
        console.log('Using cached contracts data')
        return NextResponse.json(cachedData)
      }
    } catch (cacheError) {
      console.log('Cache error, proceeding without cache:', cacheError)
    }

    const whereClause: Record<string, unknown> = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { unit: { code: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { brokerName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient(config)

    // Optimized query with compound indexes for better performance
    const contracts = await prisma.contract.findMany({
      where: whereClause,
      select: {
        id: true,
        unitId: true,
        customerId: true,
        start: true,
        totalPrice: true,
        discountAmount: true,
        brokerName: true,
        brokerPercent: true,
        brokerAmount: true,
        commissionSafeId: true,
        downPaymentSafeId: true,
        maintenanceDeposit: true,
        installmentType: true,
        installmentCount: true,
        extraAnnual: true,
        annualPaymentValue: true,
        downPayment: true,
        paymentType: true,
        createdAt: true,
        updatedAt: true,
        // Optimized relation data with only essential fields
        unit: {
          select: {
            id: true,
            code: true,
            name: true,
            unitType: true,
            totalPrice: true,
            status: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationalId: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = contracts.length > limit
    const data = hasMore ? contracts.slice(0, limit) : contracts
    const nextCursor = hasMore && data.length > 0 ? (data[data.length - 1] as any)?.id : null

    const response: PaginatedResponse<unknown> = {
      success: true,
      data,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    }

    // Cache the response for future requests (with error handling)
    try {
      await cacheClient.set(cacheKey, response, { ttl: CacheTTL.ENTITY })
      console.log('Contracts data cached successfully')
    } catch (cacheError) {
      console.log('Cache set error:', cacheError)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting contracts:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      unitId, 
      customerId, 
      start, 
      totalPrice, 
      discountAmount, 
      brokerName, 
      brokerPercent,
      brokerAmount,
      commissionSafeId,
      downPaymentSafeId,
      // Installment options
      paymentType,
      installmentType,
      installmentCount,
      downPayment,
      extraAnnual,
      annualPaymentValue,
      maintenanceDeposit
    } = body

    // Validate contract data
    const validation = validateContract({ unitId, customerId, start, totalPrice, discountAmount })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if unit exists and is available
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    if (unit.status !== 'متاحة') {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير متاحة للبيع' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 400 }
      )
    }

    // Check if unit already has a contract
    const existingContract = await prisma.contract.findFirst({
      where: { unitId, deletedAt: null }
    })

    if (existingContract) {
      return NextResponse.json(
        { success: false, error: 'الوحدة مرتبطة بعقد قائم' },
        { status: 400 }
      )
    }

    // Check if unit has partners (optional check)
    const unitPartners = await prisma.unitPartner.findMany({
      where: { unitId, deletedAt: null }
    })

    // If there are partners, validate their percentages
    if (unitPartners.length > 0) {
      const totalPercent = unitPartners.reduce((sum: number, p: { percentage: number }) => sum + p.percentage, 0)
      if (Math.abs(totalPercent - 100) > 0.01) { // Allow small floating point differences
        return NextResponse.json(
          { success: false, error: `مجموع نسب الشركاء هو ${totalPercent}% ويجب أن يكون 100% بالضبط.` },
          { status: 400 }
        )
      }
    }

    // Create contract and generate installments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate contract code
      // const contractCount = await tx.contract.count()
      // const code = `CTR-${String(contractCount + 1).padStart(5, '0')}`

      // Create contract
      const contract = await tx.contract.create({
        data: {
          unitId,
          customerId,
          start: new Date(start),
          totalPrice: totalPrice || 0,
          discountAmount: discountAmount || 0,
          brokerName,
          brokerPercent: brokerPercent || 0,
          brokerAmount: brokerAmount || 0,
          commissionSafeId,
          downPaymentSafeId,
          maintenanceDeposit: maintenanceDeposit || 0,
          installmentType: installmentType || 'شهري',
          installmentCount: installmentCount || 0,
          extraAnnual: extraAnnual || 0,
          annualPaymentValue: annualPaymentValue || 0,
          downPayment: downPayment || 0,
          paymentType: paymentType || 'installment'
        },
        include: {
          unit: true,
          customer: true
        }
      })

      // Update unit status to sold
      await tx.unit.update({
        where: { id: unitId },
        data: { status: 'مباعة' }
      })

      // Create down payment voucher if down payment > 0
      if (downPayment > 0 && downPaymentSafeId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } })
        const unit = await tx.unit.findUnique({ where: { id: unitId } })
        
        await tx.voucher.create({
          data: {
            type: 'receipt',
            date: new Date(start),
            amount: downPayment,
            safeId: downPaymentSafeId || '',
            description: `مقدم عقد للوحدة ${unit?.code}`,
            payer: customer?.name || '',
            linkedRef: unitId
          }
        })

        // Update safe balance
        await tx.safe.update({
          where: { id: downPaymentSafeId },
          data: { balance: { increment: downPayment } }
        })
      }

      // Create broker due if broker amount > 0 (instead of immediate payment)
      if (brokerAmount > 0 && brokerName) {
        // Find broker by name
        const broker = await tx.broker.findFirst({
          where: { name: brokerName }
        })

        if (broker) {
          await tx.brokerDue.create({
            data: {
              brokerId: broker.id,
              amount: brokerAmount,
              dueDate: new Date(start), // Due date is contract start date
              status: 'معلق', // Pending payment
              notes: `عمولة عقد للوحدة ${contract.unit?.code}`
            }
          })
        }
      }

      // Generate installments if payment type is installment
      if (paymentType === 'installment' && installmentCount > 0) {
        const installmentBase = totalPrice - (maintenanceDeposit || 0)
        const totalAfterDown = installmentBase - (discountAmount || 0) - (downPayment || 0)
        const totalAnnualPayments = (extraAnnual || 0) * (annualPaymentValue || 0)
        const remainingAfterAnnual = totalAfterDown - totalAnnualPayments

        if (remainingAfterAnnual < 0) {
          throw new Error('المقدم والخصم والدفعات السنوية أكبر من قيمة العقد الخاضعة للتقسيط')
        }
        if (totalAnnualPayments > totalAfterDown) {
          throw new Error('مجموع الدفعات السنوية أكبر من المبلغ المتبقي للتقسيط')
        }

        const amountForRegularInstallments = remainingAfterAnnual
        const installmentTypeMap: { [key: string]: number } = { 
          'شهري': 1, 
          'ربع سنوي': 3, 
          'نصف سنوي': 6, 
          'سنوي': 12 
        }
        const months = installmentTypeMap[installmentType] || 1
        const count = parseInt(installmentCount || '0')

        // Generate regular installments
        if (count > 0) {
          const baseAmount = Math.floor((amountForRegularInstallments / count) * 100) / 100
          let accumulatedAmount = 0
          
          for (let i = 0; i < count; i++) {
            const dueDate = new Date(start)
            dueDate.setMonth(dueDate.getMonth() + months * (i + 1))
            
            const amount = (i === count - 1) 
              ? Math.round((amountForRegularInstallments - accumulatedAmount) * 100) / 100 
              : baseAmount
            
            accumulatedAmount += amount
            
            await tx.installment.create({
              data: {
                unitId,
                amount,
                dueDate,
                status: 'غير مدفوع',
                notes: `${installmentType} - قسط ${i + 1}`
              }
            })
          }
        }

        // Generate annual payments
        for (let j = 0; j < (extraAnnual || 0); j++) {
          const dueDate = new Date(start)
          dueDate.setMonth(dueDate.getMonth() + 12 * (j + 1))
          
          await tx.installment.create({
            data: {
              unitId,
              amount: annualPaymentValue || 0,
              dueDate,
              status: 'غير مدفوع',
              notes: 'دفعة سنوية إضافية'
            }
          })
        }

        // Generate maintenance deposit installment
        if (maintenanceDeposit > 0) {
          const allInstallments = await tx.installment.findMany({
            where: { unitId },
            orderBy: { dueDate: 'desc' }
          })
          
          const lastInstallment = allInstallments[0]
          const lastDate = lastInstallment ? new Date(lastInstallment.dueDate) : new Date(start)
          lastDate.setMonth(lastDate.getMonth() + months)
          
          await tx.installment.create({
            data: {
              unitId,
              amount: maintenanceDeposit,
              dueDate: lastDate,
              status: 'غير مدفوع',
              notes: 'وديعة الصيانة'
            }
          })
        }
      }

      return contract
    })

    // Invalidate contracts cache when new contract is created (async to not block response)
    cacheClient.invalidatePattern('contracts:list:*').catch(err => 
      console.log('Cache invalidation error:', err)
    )

    const response: ApiResponse<Contract> = {
      success: true,
      data: result,
      message: paymentType === 'installment' ? 'تم إضافة العقد وتوليد الأقساط بنجاح' : 'تم إضافة العقد بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating contract:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: `خطأ في قاعدة البيانات: ${errorMessage}` },
      { status: 500 }
    )
  }
}