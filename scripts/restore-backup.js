const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreBackup(backupFile) {
  console.log('🔄 بدء استرجاع النسخة الاحتياطية...');
  
  try {
    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ ملف النسخة الاحتياطية غير موجود: ${backupFile}`);
      process.exit(1);
    }
    
    // Read backup data
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Validate backup data
    if (!backupData.metadata) {
      console.error('❌ بيانات النسخة الاحتياطية غير صحيحة');
      process.exit(1);
    }
    
    console.log(`📊 النسخة الاحتياطية تحتوي على ${backupData.metadata.totalRecords} سجل`);
    console.log(`📅 تاريخ الإنشاء: ${backupData.metadata.createdAt}`);
    
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing data (soft delete)
      const now = new Date();
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
      ]);
      
      // Insert backup data
      if (backupData.customers.length > 0) {
        await tx.customer.createMany({ data: backupData.customers });
      }
      
      if (backupData.units.length > 0) {
        await tx.unit.createMany({ data: backupData.units });
      }
      
      if (backupData.partners.length > 0) {
        await tx.partner.createMany({ data: backupData.partners });
      }
      
      if (backupData.unitPartners.length > 0) {
        await tx.unitPartner.createMany({ data: backupData.unitPartners });
      }
      
      if (backupData.contracts.length > 0) {
        await tx.contract.createMany({ data: backupData.contracts });
      }
      
      if (backupData.installments.length > 0) {
        await tx.installment.createMany({ data: backupData.installments });
      }
      
      if (backupData.partnerDebts.length > 0) {
        await tx.partnerDebt.createMany({ data: backupData.partnerDebts });
      }
      
      if (backupData.safes.length > 0) {
        await tx.safe.createMany({ data: backupData.safes });
      }
      
      if (backupData.transfers.length > 0) {
        await tx.transfer.createMany({ data: backupData.transfers });
      }
      
      if (backupData.vouchers.length > 0) {
        await tx.voucher.createMany({ data: backupData.vouchers });
      }
      
      if (backupData.brokers.length > 0) {
        await tx.broker.createMany({ data: backupData.brokers });
      }
      
      if (backupData.brokerDues.length > 0) {
        await tx.brokerDue.createMany({ data: backupData.brokerDues });
      }
      
      if (backupData.partnerGroups.length > 0) {
        await tx.partnerGroup.createMany({ data: backupData.partnerGroups });
      }
      
      if (backupData.settings.length > 0) {
        await tx.settings.createMany({ data: backupData.settings });
      }
      
      if (backupData.keyval.length > 0) {
        await tx.keyVal.createMany({ data: backupData.keyval });
      }
    });
    
    console.log(`✅ تم استرجاع النسخة الاحتياطية بنجاح - ${backupData.metadata.totalRecords} سجل`);
    
  } catch (error) {
    console.error('❌ خطأ في استرجاع النسخة الاحتياطية:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup file from command line arguments
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ يرجى تحديد ملف النسخة الاحتياطية');
  console.log('الاستخدام: node scripts/restore-backup.js <backup-file>');
  process.exit(1);
}

restoreBackup(backupFile);