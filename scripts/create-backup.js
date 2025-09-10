const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  console.log('🔄 بدء إنشاء النسخة الاحتياطية...');
  
  try {
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
    ]);
    
    const totalRecords = customers.length + units.length + partners.length + 
                        unitPartners.length + contracts.length + installments.length +
                        partnerDebts.length + safes.length + transfers.length +
                        vouchers.length + brokers.length + brokerDues.length +
                        partnerGroups.length + settings.length + keyval.length;
    
    const backupData = {
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
    };
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Save backup to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ تم إنشاء النسخة الاحتياطية بنجاح - ${totalRecords} سجل`);
    console.log(`📁 تم حفظ النسخة في: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createBackup();