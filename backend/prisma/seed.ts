import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@estate.com',
      name: 'System Administrator',
      role: 'admin',
      isActive: true
    }
  });

  console.log('✅ Admin user created:', adminUser.username);

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: hashedPassword,
      email: 'user@estate.com',
      name: 'Test User',
      role: 'user',
      isActive: true
    }
  });

  console.log('✅ Test user created:', testUser.username);

  // Create default safes
  const mainSafe = await prisma.safe.upsert({
    where: { name: 'الخزينة الرئيسية' },
    update: {},
    create: {
      name: 'الخزينة الرئيسية',
      balance: 0
    }
  });

  const secondarySafe = await prisma.safe.upsert({
    where: { name: 'الخزينة الثانوية' },
    update: {},
    create: {
      name: 'الخزينة الثانوية',
      balance: 0
    }
  });

  console.log('✅ Default safes created');

  // Create sample customers
  const customers = [
    {
      name: 'أحمد محمد علي',
      phone: '01234567890',
      nationalId: '12345678901234',
      address: 'القاهرة، مصر',
      status: 'نشط',
      notes: 'عميل VIP'
    },
    {
      name: 'فاطمة أحمد حسن',
      phone: '01234567891',
      nationalId: '12345678901235',
      address: 'الإسكندرية، مصر',
      status: 'نشط',
      notes: 'عميلة مميزة'
    },
    {
      name: 'محمد سعد إبراهيم',
      phone: '01234567892',
      nationalId: '12345678901236',
      address: 'الجيزة، مصر',
      status: 'نشط',
      notes: 'عميل جديد'
    }
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { phone: customerData.phone },
      update: {},
      create: customerData
    });
  }

  console.log('✅ Sample customers created');

  // Create sample units
  const units = [
    {
      code: 'A101',
      name: 'شقة 101 - برج أ',
      unitType: 'سكني',
      area: '120 متر',
      floor: 'الطابق الأول',
      building: 'برج أ',
      totalPrice: 500000,
      status: 'متاحة',
      notes: 'شقة مفروشة'
    },
    {
      code: 'A102',
      name: 'شقة 102 - برج أ',
      unitType: 'سكني',
      area: '150 متر',
      floor: 'الطابق الأول',
      building: 'برج أ',
      totalPrice: 600000,
      status: 'متاحة',
      notes: 'شقة دوبلكس'
    },
    {
      code: 'B201',
      name: 'محل 201 - برج ب',
      unitType: 'تجاري',
      area: '80 متر',
      floor: 'الطابق الثاني',
      building: 'برج ب',
      totalPrice: 300000,
      status: 'متاحة',
      notes: 'محل تجاري'
    }
  ];

  for (const unitData of units) {
    await prisma.unit.upsert({
      where: { code: unitData.code },
      update: {},
      create: unitData
    });
  }

  console.log('✅ Sample units created');

  // Create sample partners
  const partners = [
    {
      name: 'شركة البناء المتقدم',
      phone: '01234567893',
      notes: 'شريك في المشروع أ'
    },
    {
      name: 'مؤسسة الاستثمار العقاري',
      phone: '01234567894',
      notes: 'شريك في المشروع ب'
    }
  ];

  for (const partnerData of partners) {
    await prisma.partner.upsert({
      where: { name: partnerData.name },
      update: {},
      create: partnerData
    });
  }

  console.log('✅ Sample partners created');

  // Create sample brokers
  const brokers = [
    {
      name: 'وكالة العقارات الذهبية',
      phone: '01234567895',
      notes: 'وكيل معتمد'
    },
    {
      name: 'مكتب الوساطة العقارية',
      phone: '01234567896',
      notes: 'وكيل محلي'
    }
  ];

  for (const brokerData of brokers) {
    await prisma.broker.upsert({
      where: { name: brokerData.name },
      update: {},
      create: brokerData
    });
  }

  console.log('✅ Sample brokers created');

  // Create sample vouchers
  const vouchers = [
    {
      type: 'receipt',
      date: new Date('2024-01-01'),
      amount: 100000,
      safeId: mainSafe.id,
      description: 'دفعة مقدمة من عميل',
      payer: 'أحمد محمد علي',
      beneficiary: 'الشركة'
    },
    {
      type: 'payment',
      date: new Date('2024-01-02'),
      amount: 50000,
      safeId: mainSafe.id,
      description: 'مصاريف تشغيلية',
      payer: 'الشركة',
      beneficiary: 'مورد مواد البناء'
    }
  ];

  for (const voucherData of vouchers) {
    await prisma.voucher.create({
      data: voucherData
    });
  }

  console.log('✅ Sample vouchers created');

  // Update safe balances
  const totalReceipts = await prisma.voucher.aggregate({
    where: { type: 'receipt', deletedAt: null },
    _sum: { amount: true }
  });

  const totalPayments = await prisma.voucher.aggregate({
    where: { type: 'payment', deletedAt: null },
    _sum: { amount: true }
  });

  const netBalance = (totalReceipts._sum.amount || 0) - (totalPayments._sum.amount || 0);

  await prisma.safe.update({
    where: { id: mainSafe.id },
    data: { balance: netBalance }
  });

  console.log('✅ Safe balances updated');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });