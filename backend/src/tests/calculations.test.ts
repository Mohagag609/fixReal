import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Calculations Service', () => {
  beforeEach(async () => {
    // تنظيف قاعدة البيانات قبل كل اختبار
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.voucher.deleteMany()
    await prisma.transfer.deleteMany()
    await prisma.safe.deleteMany()
    await prisma.brokerDue.deleteMany()
    await prisma.broker.deleteMany()
    await prisma.partnerDebt.deleteMany()
    await prisma.partnerGroupPartner.deleteMany()
    await prisma.unitPartnerGroup.deleteMany()
    await prisma.partnerGroup.deleteMany()
    await prisma.partner.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.installment.deleteMany()
    await prisma.contract.deleteMany()
    await prisma.unit.deleteMany()
    await prisma.customer.deleteMany()
  })

  afterEach(async () => {
    // تنظيف قاعدة البيانات بعد كل اختبار
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.voucher.deleteMany()
    await prisma.transfer.deleteMany()
    await prisma.safe.deleteMany()
    await prisma.brokerDue.deleteMany()
    await prisma.broker.deleteMany()
    await prisma.partnerDebt.deleteMany()
    await prisma.partnerGroupPartner.deleteMany()
    await prisma.unitPartnerGroup.deleteMany()
    await prisma.partnerGroup.deleteMany()
    await prisma.partner.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.installment.deleteMany()
    await prisma.contract.deleteMany()
    await prisma.unit.deleteMany()
    await prisma.customer.deleteMany()
  })

  describe('Customer Balance Calculations', () => {
    it('should calculate customer balance correctly', async () => {
      // إنشاء عميل
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '1234567890'
        }
      })

      // إنشاء معاملات للعميل
      await prisma.transaction.createMany({
        data: [
          {
            customerId: customer.id,
            type: 'income',
            amount: 1000,
            description: 'Payment received'
          },
          {
            customerId: customer.id,
            type: 'expense',
            amount: 300,
            description: 'Refund given'
          }
        ]
      })

      // حساب الرصيد
      const income = await prisma.transaction.aggregate({
        where: {
          customerId: customer.id,
          type: 'income'
        },
        _sum: {
          amount: true
        }
      })

      const expenses = await prisma.transaction.aggregate({
        where: {
          customerId: customer.id,
          type: 'expense'
        },
        _sum: {
          amount: true
        }
      })

      const balance = (income._sum.amount || 0) - (expenses._sum.amount || 0)

      expect(balance).toBe(700)
    })

    it('should handle zero balance correctly', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      })

      const income = await prisma.transaction.aggregate({
        where: {
          customerId: customer.id,
          type: 'income'
        },
        _sum: {
          amount: true
        }
      })

      const expenses = await prisma.transaction.aggregate({
        where: {
          customerId: customer.id,
          type: 'expense'
        },
        _sum: {
          amount: true
        }
      })

      const balance = (income._sum.amount || 0) - (expenses._sum.amount || 0)

      expect(balance).toBe(0)
    })
  })

  describe('Unit Profit/Loss Calculations', () => {
    it('should calculate unit profit correctly', async () => {
      // إنشاء وحدة
      const unit = await prisma.unit.create({
        data: {
          name: 'Test Unit',
          price: 500000,
          description: 'Test unit for profit calculation'
        }
      })

      // إنشاء عقد للوحدة
      const contract = await prisma.contract.create({
        data: {
          contractNumber: 'CONTRACT-001',
          customerId: (await prisma.customer.create({
            data: {
              name: 'Test Customer',
              email: 'test@example.com'
            }
          })).id,
          unitId: unit.id,
          contractDate: new Date(),
          amount: 600000
        }
      })

      // حساب الربح
      const profit = contract.amount - unit.price

      expect(profit).toBe(100000)
    })

    it('should calculate unit loss correctly', async () => {
      const unit = await prisma.unit.create({
        data: {
          name: 'Test Unit',
          price: 500000,
          description: 'Test unit for loss calculation'
        }
      })

      const contract = await prisma.contract.create({
        data: {
          contractNumber: 'CONTRACT-002',
          customerId: (await prisma.customer.create({
            data: {
              name: 'Test Customer',
              email: 'test@example.com'
            }
          })).id,
          unitId: unit.id,
          contractDate: new Date(),
          amount: 400000
        }
      })

      const loss = unit.price - contract.amount

      expect(loss).toBe(100000)
    })
  })

  describe('Safe Balance Calculations', () => {
    it('should calculate safe balance correctly', async () => {
      // إنشاء خزينة
      const safe = await prisma.safe.create({
        data: {
          name: 'Test Safe',
          balance: 10000,
          description: 'Test safe for balance calculation'
        }
      })

      // إنشاء تحويلات
      await prisma.transfer.createMany({
        data: [
          {
            fromSafeId: safe.id,
            toSafeId: (await prisma.safe.create({
              data: {
                name: 'Other Safe',
                balance: 0
              }
            })).id,
            amount: 2000,
            description: 'Transfer out'
          }
        ]
      })

      // حساب الرصيد الجديد
      const transfersOut = await prisma.transfer.aggregate({
        where: {
          fromSafeId: safe.id
        },
        _sum: {
          amount: true
        }
      })

      const transfersIn = await prisma.transfer.aggregate({
        where: {
          toSafeId: safe.id
        },
        _sum: {
          amount: true
        }
      })

      const newBalance = safe.balance - (transfersOut._sum.amount || 0) + (transfersIn._sum.amount || 0)

      expect(newBalance).toBe(8000)
    })
  })

  describe('Contract Installment Calculations', () => {
    it('should calculate total installments correctly', async () => {
      const contract = await prisma.contract.create({
        data: {
          contractNumber: 'CONTRACT-003',
          customerId: (await prisma.customer.create({
            data: {
              name: 'Test Customer',
              email: 'test@example.com'
            }
          })).id,
          unitId: (await prisma.unit.create({
            data: {
              name: 'Test Unit',
              price: 500000
            }
          })).id,
          contractDate: new Date(),
          amount: 600000
        }
      })

      // إنشاء أقساط
      await prisma.installment.createMany({
        data: [
          {
            contractId: contract.id,
            amount: 100000,
            dueDate: new Date('2024-01-01'),
            status: 'paid'
          },
          {
            contractId: contract.id,
            amount: 100000,
            dueDate: new Date('2024-02-01'),
            status: 'paid'
          },
          {
            contractId: contract.id,
            amount: 100000,
            dueDate: new Date('2024-03-01'),
            status: 'pending'
          }
        ]
      })

      // حساب إجمالي الأقساط
      const totalInstallments = await prisma.installment.aggregate({
        where: {
          contractId: contract.id
        },
        _sum: {
          amount: true
        }
      })

      expect(totalInstallments._sum.amount).toBe(300000)
    })

    it('should calculate paid installments correctly', async () => {
      const contract = await prisma.contract.create({
        data: {
          contractNumber: 'CONTRACT-004',
          customerId: (await prisma.customer.create({
            data: {
              name: 'Test Customer',
              email: 'test@example.com'
            }
          })).id,
          unitId: (await prisma.unit.create({
            data: {
              name: 'Test Unit',
              price: 500000
            }
          })).id,
          contractDate: new Date(),
          amount: 600000
        }
      })

      await prisma.installment.createMany({
        data: [
          {
            contractId: contract.id,
            amount: 100000,
            dueDate: new Date('2024-01-01'),
            status: 'paid',
            paidDate: new Date('2024-01-01')
          },
          {
            contractId: contract.id,
            amount: 100000,
            dueDate: new Date('2024-02-01'),
            status: 'paid',
            paidDate: new Date('2024-02-01')
          },
          {
            contractId: contract.id,
            amount: 100000,
            dueDate: new Date('2024-03-01'),
            status: 'pending'
          }
        ]
      })

      const paidInstallments = await prisma.installment.aggregate({
        where: {
          contractId: contract.id,
          status: 'paid'
        },
        _sum: {
          amount: true
        }
      })

      expect(paidInstallments._sum.amount).toBe(200000)
    })
  })

  describe('Partner Debt Calculations', () => {
    it('should calculate partner total debt correctly', async () => {
      const partner = await prisma.partner.create({
        data: {
          name: 'Test Partner',
          email: 'partner@example.com'
        }
      })

      await prisma.partnerDebt.createMany({
        data: [
          {
            partnerId: partner.id,
            amount: 5000,
            description: 'Debt 1',
            status: 'pending'
          },
          {
            partnerId: partner.id,
            amount: 3000,
            description: 'Debt 2',
            status: 'pending'
          },
          {
            partnerId: partner.id,
            amount: 2000,
            description: 'Debt 3',
            status: 'paid'
          }
        ]
      })

      const totalDebt = await prisma.partnerDebt.aggregate({
        where: {
          partnerId: partner.id,
          status: 'pending'
        },
        _sum: {
          amount: true
        }
      })

      expect(totalDebt._sum.amount).toBe(8000)
    })
  })

  describe('Broker Due Calculations', () => {
    it('should calculate broker total dues correctly', async () => {
      const broker = await prisma.broker.create({
        data: {
          name: 'Test Broker',
          email: 'broker@example.com'
        }
      })

      await prisma.brokerDue.createMany({
        data: [
          {
            brokerId: broker.id,
            amount: 1000,
            description: 'Due 1',
            status: 'pending'
          },
          {
            brokerId: broker.id,
            amount: 1500,
            description: 'Due 2',
            status: 'pending'
          },
          {
            brokerId: broker.id,
            amount: 500,
            description: 'Due 3',
            status: 'paid'
          }
        ]
      })

      const totalDues = await prisma.brokerDue.aggregate({
        where: {
          brokerId: broker.id,
          status: 'pending'
        },
        _sum: {
          amount: true
        }
      })

      expect(totalDues._sum.amount).toBe(2500)
    })
  })

  describe('Financial Summary Calculations', () => {
    it('should calculate total income correctly', async () => {
      await prisma.transaction.createMany({
        data: [
          {
            type: 'income',
            amount: 1000,
            description: 'Income 1'
          },
          {
            type: 'income',
            amount: 2000,
            description: 'Income 2'
          },
          {
            type: 'expense',
            amount: 500,
            description: 'Expense 1'
          }
        ]
      })

      const totalIncome = await prisma.transaction.aggregate({
        where: {
          type: 'income'
        },
        _sum: {
          amount: true
        }
      })

      expect(totalIncome._sum.amount).toBe(3000)
    })

    it('should calculate total expenses correctly', async () => {
      await prisma.transaction.createMany({
        data: [
          {
            type: 'expense',
            amount: 1000,
            description: 'Expense 1'
          },
          {
            type: 'expense',
            amount: 2000,
            description: 'Expense 2'
          },
          {
            type: 'income',
            amount: 500,
            description: 'Income 1'
          }
        ]
      })

      const totalExpenses = await prisma.transaction.aggregate({
        where: {
          type: 'expense'
        },
        _sum: {
          amount: true
        }
      })

      expect(totalExpenses._sum.amount).toBe(3000)
    })

    it('should calculate net profit correctly', async () => {
      await prisma.transaction.createMany({
        data: [
          {
            type: 'income',
            amount: 5000,
            description: 'Income 1'
          },
          {
            type: 'income',
            amount: 3000,
            description: 'Income 2'
          },
          {
            type: 'expense',
            amount: 2000,
            description: 'Expense 1'
          },
          {
            type: 'expense',
            amount: 1000,
            description: 'Expense 2'
          }
        ]
      })

      const totalIncome = await prisma.transaction.aggregate({
        where: {
          type: 'income'
        },
        _sum: {
          amount: true
        }
      })

      const totalExpenses = await prisma.transaction.aggregate({
        where: {
          type: 'expense'
        },
        _sum: {
          amount: true
        }
      })

      const netProfit = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0)

      expect(netProfit).toBe(5000)
    })
  })
})