import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { cache as cacheClient } from '@/lib/cache/redis'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/contracts/bulk - Bulk create contracts
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const body = await request.json()
    const { contracts } = body

    if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب إرسال قائمة من العقود' },
        { status: 400 }
      )
    }

    if (contracts.length > 100) {
      return NextResponse.json(
        { success: false, error: 'الحد الأقصى 100 عقد في المرة الواحدة' },
        { status: 400 }
      )
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
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect()
    } catch (error) {
      console.log('Reconnecting to database...')
    }

    // تحضير البيانات للاستيراد
    const contractsToCreate = contracts.map(contract => ({
      unitId: contract.unitId,
      customerId: contract.customerId,
      start: new Date(contract.start || new Date()),
      totalPrice: contract.totalPrice ? parseFloat(contract.totalPrice) : 0,
      discountAmount: contract.discountAmount ? parseFloat(contract.discountAmount) : 0,
      brokerName: contract.brokerName?.trim() || null,
      brokerPercent: contract.brokerPercent ? parseFloat(contract.brokerPercent) : 0,
      brokerAmount: contract.brokerAmount ? parseFloat(contract.brokerAmount) : 0,
      commissionSafeId: contract.commissionSafeId || null,
      downPaymentSafeId: contract.downPaymentSafeId || null,
      maintenanceDeposit: contract.maintenanceDeposit ? parseFloat(contract.maintenanceDeposit) : 0,
      installmentType: contract.installmentType || 'شهري',
      installmentCount: contract.installmentCount ? parseInt(contract.installmentCount) : 0,
      extraAnnual: contract.extraAnnual ? parseInt(contract.extraAnnual) : 0,
      annualPaymentValue: contract.annualPaymentValue ? parseFloat(contract.annualPaymentValue) : 0,
      downPayment: contract.downPayment ? parseFloat(contract.downPayment) : 0,
      paymentType: contract.paymentType || 'installment',
      createdAt: new Date(),
      updatedAt: new Date()
    })).filter(contract => contract.unitId && contract.customerId)

    if (contractsToCreate.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'لا توجد عقود صالحة للاستيراد' },
        { status: 400 }
      )
    }

    // فحص صحة البيانات
    const unitIds = [...new Set(contractsToCreate.map(c => c.unitId))]
    const customerIds = [...new Set(contractsToCreate.map(c => c.customerId))]

    const [existingUnits, existingCustomers] = await Promise.all([
      prisma.unit.findMany({
        where: { id: { in: unitIds }, deletedAt: null },
        select: { id: true, status: true }
      }),
      prisma.customer.findMany({
        where: { id: { in: customerIds }, deletedAt: null },
        select: { id: true }
      })
    ])

    const validUnitIds = new Set(existingUnits.map(u => u.id))
    const validCustomerIds = new Set(existingCustomers.map(c => c.id))

    // تصفية العقود الصالحة
    const validContracts = contractsToCreate.filter(contract => 
      validUnitIds.has(contract.unitId) && 
      validCustomerIds.has(contract.customerId)
    )

    if (validContracts.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'لا توجد عقود صالحة للاستيراد' },
        { status: 400 }
      )
    }

    // استخدام createMany للاستيراد السريع
    const result = await prisma.contract.createMany({
      data: validContracts,
      skipDuplicates: true
    })

    await prisma.$disconnect()

    // تعطيل cache invalidation أثناء bulk insert لتحسين الأداء
    cacheClient.invalidatePattern('contracts:list:*').catch(err => 
      console.log('Cache invalidation error:', err)
    )

    const response: ApiResponse<{ count: number, skipped: number }> = {
      success: true,
      data: {
        count: result.count,
        skipped: contractsToCreate.length - validContracts.length
      },
      message: `تم إضافة ${result.count} عقد بنجاح${result.count < validContracts.length ? `، تم تجاهل ${contractsToCreate.length - validContracts.length} عقد غير صالح` : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error bulk creating contracts:', error)
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
