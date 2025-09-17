import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample safes
  const safe1 = await prisma.safe.upsert({
    where: { name: 'الخزينة الرئيسية' },
    update: {},
    create: {
      name: 'الخزينة الرئيسية',
      balance: 100000,
    },
  })

  const safe2 = await prisma.safe.upsert({
    where: { name: 'خزينة المبيعات' },
    update: {},
    create: {
      name: 'خزينة المبيعات',
      balance: 50000,
    },
  })

  console.log('Created safes:', { safe1: safe1.name, safe2: safe2.name })

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { phone: '01234567890' },
    update: {},
    create: {
      name: 'أحمد محمد علي',
      phone: '01234567890',
      nationalId: '12345678901234',
      address: 'القاهرة - مصر الجديدة',
      status: 'نشط',
    },
  })

  await prisma.customer.upsert({
    where: { phone: '01234567891' },
    update: {},
    create: {
      name: 'فاطمة أحمد حسن',
      phone: '01234567891',
      nationalId: '12345678901235',
      address: 'الجيزة - الدقي',
      status: 'نشط',
    },
  })

  // Create sample units
  const unit1 = await prisma.unit.upsert({
    where: { code: 'A101' },
    update: {},
    create: {
      code: 'A101',
      name: 'شقة 101 - برج أ',
      unitType: 'سكني',
      area: '120 متر',
      floor: 'الطابق الأول',
      building: 'برج أ',
      totalPrice: 500000,
      status: 'متاحة',
    },
  })

  await prisma.unit.upsert({
    where: { code: 'A102' },
    update: {},
    create: {
      code: 'A102',
      name: 'شقة 102 - برج أ',
      unitType: 'سكني',
      area: '100 متر',
      floor: 'الطابق الأول',
      building: 'برج أ',
      totalPrice: 450000,
      status: 'متاحة',
    },
  })

  // Create sample partners
  await prisma.partner.create({
    data: {
      name: 'شركة البناء الحديث',
      phone: '01234567892',
      notes: 'شريك في المشروع',
    },
  })

  // Create sample contracts
  await prisma.contract.create({
    data: {
      unitId: unit1.id,
      customerId: customer1.id,
      start: new Date('2024-01-01'),
      totalPrice: 500000,
      discountAmount: 10000,
      downPayment: 100000,
      installmentType: 'شهري',
      installmentCount: 24,
      paymentType: 'installment',
    },
  })

  // Create sample installments
  for (let i = 0; i < 24; i++) {
    const dueDate = new Date('2024-01-01')
    dueDate.setMonth(dueDate.getMonth() + i)
    
    await prisma.installment.create({
      data: {
        unitId: unit1.id,
        amount: 16250, // (500000 - 100000) / 24
        dueDate,
        status: i < 3 ? 'مدفوع' : 'معلق',
      },
    })
  }

  // Create sample vouchers
  await prisma.voucher.create({
    data: {
      type: 'receipt',
      date: new Date('2024-01-01'),
      amount: 100000,
      safeId: safe1.id,
      description: 'دفعة مقدمة - عقد شقة A101',
      payer: customer1.name,
      beneficiary: 'الشركة',
      linkedRef: unit1.id,
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })