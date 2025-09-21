import { CalculationService } from '../services/calculationService';
import prisma from '../config/database';

// Mock Prisma
jest.mock('../config/database');

describe('CalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      // Mock Prisma responses
      (prisma.customer.count as jest.Mock).mockResolvedValue(10);
      (prisma.unit.count as jest.Mock).mockResolvedValue(5);
      (prisma.contract.count as jest.Mock).mockResolvedValue(8);
      (prisma.voucher.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // revenue
        .mockResolvedValueOnce({ _sum: { amount: 20000 } })  // expenses
        .mockResolvedValueOnce({ _sum: { balance: 50000 } }); // safes balance
      (prisma.installment.count as jest.Mock)
        .mockResolvedValueOnce(15) // active
        .mockResolvedValueOnce(3); // overdue
      (prisma.safe.count as jest.Mock).mockResolvedValue(2);

      const result = await CalculationService.getDashboardStats();

      expect(result).toEqual({
        totalCustomers: 10,
        totalUnits: 5,
        totalContracts: 8,
        totalRevenue: 100000,
        totalExpenses: 20000,
        netProfit: 80000,
        activeInstallments: 15,
        overdueInstallments: 3,
        totalSafes: 2,
        totalSafesBalance: 50000
      });
    });
  });

  describe('getFinancialSummary', () => {
    it('should return financial summary', async () => {
      (prisma.voucher.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // revenue
        .mockResolvedValueOnce({ _sum: { amount: 20000 } })  // expenses
        .mockResolvedValueOnce({ _sum: { balance: 50000 } }); // safes balance

      const result = await CalculationService.getFinancialSummary();

      expect(result).toEqual({
        totalRevenue: 100000,
        totalExpenses: 20000,
        netProfit: 80000,
        profitMargin: 80,
        totalAssets: 50000,
        totalLiabilities: 0,
        netWorth: 50000
      });
    });
  });

  describe('getSafeBalances', () => {
    it('should return safe balances', async () => {
      const mockSafes = [
        {
          id: '1',
          name: 'Safe 1',
          balance: 30000,
          vouchers: [{ date: new Date('2024-01-01') }]
        },
        {
          id: '2',
          name: 'Safe 2',
          balance: 20000,
          vouchers: []
        }
      ];

      (prisma.safe.findMany as jest.Mock).mockResolvedValue(mockSafes);

      const result = await CalculationService.getSafeBalances();

      expect(result).toEqual([
        {
          safeId: '1',
          safeName: 'Safe 1',
          balance: 30000,
          lastTransactionDate: new Date('2024-01-01')
        },
        {
          safeId: '2',
          safeName: 'Safe 2',
          balance: 20000,
          lastTransactionDate: undefined
        }
      ]);
    });
  });

  describe('getInstallmentStatusSummary', () => {
    it('should return installment status summary', async () => {
      (prisma.installment.count as jest.Mock)
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(5)  // paid
        .mockResolvedValueOnce(2); // overdue
      (prisma.installment.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // total
        .mockResolvedValueOnce({ _sum: { amount: 50000 } }); // paid

      // Mock calculateOverdueAmount
      jest.spyOn(CalculationService as any, 'calculateOverdueAmount').mockResolvedValue(10000);

      const result = await CalculationService.getInstallmentStatusSummary();

      expect(result).toEqual({
        pending: 10,
        paid: 5,
        overdue: 2,
        total: 17,
        totalAmount: 100000,
        paidAmount: 50000,
        pendingAmount: 50000,
        overdueAmount: 10000
      });
    });
  });
});