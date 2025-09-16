// Backup and restore utilities

import { prisma } from './db'

import { createCriticalNotification } from './notifications'

export interface BackupData {
  customers: unknown[]
  units: unknown[]
  partners: unknown[]
  unitPartners: unknown[]
  contracts: unknown[]
  installments: unknown[]
  partnerDebts: unknown[]
  safes: unknown[]
  transfers: unknown[]
  vouchers: unknown[]
  brokers: unknown[]
  brokerDues: unknown[]
  partnerGroups: unknown[]
  settings: unknown[]
  keyval: unknown[]
  metadata: {
    version: string
    createdAt: string
    totalRecords: number
  }
}

// Create backup
export async function createBackup(): Promise<BackupData> {
  try {
    console.log('🔄 بدء إنشاء النسخة الاحتياطية...')
    
    // Get all data from all tables
    const [
      customers,
      units,
      partners,
      unitPartners,
      contracts,
      installments,
      partnerDebts,
      safes,
      transfers,
      vouchers,
      brokers,
      brokerDues,
      partnerGroups,
      settings,
      keyval
    ] = await Promise.all([
      prisma.customer.findMany({ where: { deletedAt: null } }),
      prisma.unit.findMany({ where: { deletedAt: null } }),
      prisma.partner.findMany({ where: { deletedAt: null } }),
      prisma.unitPartner.findMany({ where: { deletedAt: null } }),
      prisma.contract.findMany({ where: { deletedAt: null } }),
      prisma.installment.findMany({ where: { deletedAt: null } }),
      prisma.partnerDebt.findMany({ where: { deletedAt: null } }),
      prisma.safe.findMany({ where: { deletedAt: null } }),
      prisma.transfer.findMany({ where: { deletedAt: null } }),
      prisma.voucher.findMany({ where: { deletedAt: null } }),
      prisma.broker.findMany({ where: { deletedAt: null } }),
      prisma.brokerDue.findMany({ where: { deletedAt: null } }),
      prisma.partnerGroup.findMany({ where: { deletedAt: null } }),
      prisma.settings.findMany(),
      prisma.keyVal.findMany()
    ])
    
    const totalRecords = customers.length + units.length + partners.length + 
                        unitPartners.length + contracts.length + installments.length +
                        partnerDebts.length + safes.length + transfers.length +
                        vouchers.length + brokers.length + brokerDues.length +
                        partnerGroups.length + settings.length + keyval.length
    
    const backupData: BackupData = {
      customers,
      units,
      partners,
      unitPartners,
      contracts,
      installments,
      partnerDebts,
      safes,
      transfers,
      vouchers,
      brokers,
      brokerDues,
      partnerGroups,
      settings,
      keyval,
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        totalRecords
      }
    }
    
    console.log(`✅ تم إنشاء النسخة الاحتياطية بنجاح - ${totalRecords} سجل`)
    
    // Create notification
    await createCriticalNotification(
      'تم إنشاء نسخة احتياطية',
      `تم إنشاء نسخة احتياطية تحتوي على ${totalRecords} سجل`,
      'backup',
      { totalRecords, createdAt: backupData.metadata.createdAt }
    )
    
    return backupData
  } catch (error) {
    console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error)
    throw error
  }
}

// Restore backup
export async function restoreBackup(backupData: BackupData): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 بدء استرجاع النسخة الاحتياطية...')
    
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing data (soft delete)
      const now = new Date()
      await Promise.all([
        tx.customer.updateMany({ data: { deletedAt: now } }),
        tx.unit.updateMany({ data: { deletedAt: now } }),
        tx.partner.updateMany({ data: { deletedAt: now } }),
        tx.unitPartner.updateMany({ data: { deletedAt: now } }),
        tx.contract.updateMany({ data: { deletedAt: now } }),
        tx.installment.updateMany({ data: { deletedAt: now } }),
        tx.partnerDebt.updateMany({ data: { deletedAt: now } }),
        tx.safe.updateMany({ data: { deletedAt: now } }),
        tx.transfer.updateMany({ data: { deletedAt: now } }),
        tx.voucher.updateMany({ data: { deletedAt: now } }),
        tx.broker.updateMany({ data: { deletedAt: now } }),
        tx.brokerDue.updateMany({ data: { deletedAt: now } }),
        tx.partnerGroup.updateMany({ data: { deletedAt: now } }),
        tx.settings.deleteMany({}),
        tx.keyVal.deleteMany({})
      ])
      
      // Insert backup data
      if (backupData.customers.length > 0) {
        await tx.customer.createMany({ data: backupData.customers })
      }
      
      if (backupData.units.length > 0) {
        await tx.unit.createMany({ data: backupData.units })
      }
      
      if (backupData.partners.length > 0) {
        await tx.partner.createMany({ data: backupData.partners })
      }
      
      if (backupData.unitPartners.length > 0) {
        await tx.unitPartner.createMany({ data: backupData.unitPartners })
      }
      
      if (backupData.contracts.length > 0) {
        await tx.contract.createMany({ data: backupData.contracts })
      }
      
      if (backupData.installments.length > 0) {
        await tx.installment.createMany({ data: backupData.installments })
      }
      
      if (backupData.partnerDebts.length > 0) {
        await tx.partnerDebt.createMany({ data: backupData.partnerDebts })
      }
      
      if (backupData.safes.length > 0) {
        await tx.safe.createMany({ data: backupData.safes })
      }
      
      if (backupData.transfers.length > 0) {
        await tx.transfer.createMany({ data: backupData.transfers })
      }
      
      if (backupData.vouchers.length > 0) {
        await tx.voucher.createMany({ data: backupData.vouchers })
      }
      
      if (backupData.brokers.length > 0) {
        await tx.broker.createMany({ data: backupData.brokers })
      }
      
      if (backupData.brokerDues.length > 0) {
        await tx.brokerDue.createMany({ data: backupData.brokerDues })
      }
      
      if (backupData.partnerGroups.length > 0) {
        await tx.partnerGroup.createMany({ data: backupData.partnerGroups })
      }
      
      if (backupData.settings.length > 0) {
        await tx.settings.createMany({ data: backupData.settings })
      }
      
      if (backupData.keyval.length > 0) {
        await tx.keyVal.createMany({ data: backupData.keyval })
      }
    })
    
    console.log(`✅ تم استرجاع النسخة الاحتياطية بنجاح - ${backupData.metadata.totalRecords} سجل`)
    
    // Create notification
    await createCriticalNotification(
      'تم استرجاع نسخة احتياطية',
      `تم استرجاع نسخة احتياطية تحتوي على ${backupData.metadata.totalRecords} سجل`,
      'backup',
      { totalRecords: backupData.metadata.totalRecords, restoredAt: new Date().toISOString() }
    )
    
    return {
      success: true,
      message: `تم استرجاع النسخة الاحتياطية بنجاح - ${backupData.metadata.totalRecords} سجل`
    }
  } catch (error) {
    console.error('❌ خطأ في استرجاع النسخة الاحتياطية:', error)
    return {
      success: false,
      message: 'خطأ في استرجاع النسخة الاحتياطية'
    }
  }
}

// Validate backup data
export function validateBackupData(backupData: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!backupData) {
    errors.push('البيانات غير موجودة')
    return { isValid: false, errors }
  }
  
  if (!backupData.metadata) {
    errors.push('معلومات النسخة الاحتياطية غير موجودة')
  }
  
  if (!backupData.metadata?.version) {
    errors.push('إصدار النسخة الاحتياطية غير محدد')
  }
  
  if (!backupData.metadata?.createdAt) {
    errors.push('تاريخ إنشاء النسخة الاحتياطية غير محدد')
  }
  
  if (!backupData.metadata?.totalRecords) {
    errors.push('عدد السجلات غير محدد')
  }
  
  // Check required tables
  const requiredTables = [
    'customers', 'units', 'partners', 'unitPartners', 'contracts',
    'installments', 'partnerDebts', 'safes', 'transfers', 'vouchers',
    'brokers', 'brokerDues', 'partnerGroups', 'settings', 'keyval'
  ]
  
  for (const table of requiredTables) {
    if (!Array.isArray(backupData[table])) {
      errors.push(`جدول ${table} غير صحيح`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get backup statistics
export async function getBackupStatistics(): Promise<{
  totalRecords: number
  tableCounts: Record<string, number>
  lastBackupDate?: string
}> {
  try {
    const [
      customerCount,
      unitCount,
      partnerCount,
      unitPartnerCount,
      contractCount,
      installmentCount,
      partnerDebtCount,
      safeCount,
      transferCount,
      voucherCount,
      brokerCount,
      brokerDueCount,
      partnerGroupCount,
      settingCount,
      keyvalCount
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { deletedAt: null } }),
      prisma.partner.count({ where: { deletedAt: null } }),
      prisma.unitPartner.count({ where: { deletedAt: null } }),
      prisma.contract.count({ where: { deletedAt: null } }),
      prisma.installment.count({ where: { deletedAt: null } }),
      prisma.partnerDebt.count({ where: { deletedAt: null } }),
      prisma.safe.count({ where: { deletedAt: null } }),
      prisma.transfer.count({ where: { deletedAt: null } }),
      prisma.voucher.count({ where: { deletedAt: null } }),
      prisma.broker.count({ where: { deletedAt: null } }),
      prisma.brokerDue.count({ where: { deletedAt: null } }),
      prisma.partnerGroup.count({ where: { deletedAt: null } }),
      prisma.settings.count(),
      prisma.keyVal.count()
    ])
    
    const totalRecords = customerCount + unitCount + partnerCount + unitPartnerCount +
                        contractCount + installmentCount + partnerDebtCount + safeCount +
                        transferCount + voucherCount + brokerCount + brokerDueCount +
                        partnerGroupCount + settingCount + keyvalCount
    
    const tableCounts = {
      customers: customerCount,
      units: unitCount,
      partners: partnerCount,
      unitPartners: unitPartnerCount,
      contracts: contractCount,
      installments: installmentCount,
      partnerDebts: partnerDebtCount,
      safes: safeCount,
      transfers: transferCount,
      vouchers: voucherCount,
      brokers: brokerCount,
      brokerDues: brokerDueCount,
      partnerGroups: partnerGroupCount,
      settings: settingCount,
      keyval: keyvalCount
    }
    
    return {
      totalRecords,
      tableCounts
    }
  } catch (error) {
    console.error('Error getting backup statistics:', error)
    throw error
  }
}