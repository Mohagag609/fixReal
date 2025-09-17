import prisma from '../config/database';
import { DashboardStats, FinancialSummary, SafeBalance, InstallmentStatusSummary } from '../types';

export class CalculationService {
  /**
   * Calculate dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalCustomers,
      totalUnits,
      totalContracts,
      totalRevenue,
      totalExpenses,
      activeInstallments,
      overdueInstallments,
      totalSafes,
      totalSafesBalance
    ] = await Promise.all([
      // Total customers (active only)
      prisma.customer.count({
        where: { deletedAt: null, status: 'نشط' }
      }),
      
      // Total units (available only)
      prisma.unit.count({
        where: { deletedAt: null, status: 'متاحة' }
      }),
      
      // Total contracts
      prisma.contract.count({
        where: { deletedAt: null }
      }),
      
      // Total revenue from vouchers (receipts)
      prisma.voucher.aggregate({
        where: { 
          deletedAt: null,
          type: 'receipt'
        },
        _sum: { amount: true }
      }),
      
      // Total expenses from vouchers (payments)
      prisma.voucher.aggregate({
        where: { 
          deletedAt: null,
          type: 'payment'
        },
        _sum: { amount: true }
      }),
      
      // Active installments
      prisma.installment.count({
        where: { 
          deletedAt: null,
          status: 'معلق'
        }
      }),
      
      // Overdue installments
      prisma.installment.count({
        where: { 
          deletedAt: null,
          status: 'معلق',
          dueDate: { lt: new Date() }
        }
      }),
      
      // Total safes
      prisma.safe.count({
        where: { deletedAt: null }
      }),
      
      // Total safes balance
      prisma.safe.aggregate({
        where: { deletedAt: null },
        _sum: { balance: true }
      })
    ]);

    const revenue = totalRevenue._sum.amount || 0;
    const expenses = totalExpenses._sum.amount || 0;
    const netProfit = revenue - expenses;

    return {
      totalCustomers,
      totalUnits,
      totalContracts,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit,
      activeInstallments,
      overdueInstallments,
      totalSafes,
      totalSafesBalance: totalSafesBalance._sum.balance || 0
    };
  }

  /**
   * Calculate financial summary
   */
  static async getFinancialSummary(): Promise<FinancialSummary> {
    const [revenue, expenses, safesBalance] = await Promise.all([
      prisma.voucher.aggregate({
        where: { 
          deletedAt: null,
          type: 'receipt'
        },
        _sum: { amount: true }
      }),
      
      prisma.voucher.aggregate({
        where: { 
          deletedAt: null,
          type: 'payment'
        },
        _sum: { amount: true }
      }),
      
      prisma.safe.aggregate({
        where: { deletedAt: null },
        _sum: { balance: true }
      })
    ]);

    const totalRevenue = revenue._sum.amount || 0;
    const totalExpenses = expenses._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalAssets = safesBalance._sum.balance || 0;
    const totalLiabilities = 0; // Can be calculated based on business rules
    const netWorth = totalAssets - totalLiabilities;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalAssets,
      totalLiabilities,
      netWorth
    };
  }

  /**
   * Get safe balances
   */
  static async getSafeBalances(): Promise<SafeBalance[]> {
    const safes = await prisma.safe.findMany({
      where: { deletedAt: null },
      include: {
        vouchers: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    return safes.map(safe => ({
      safeId: safe.id,
      safeName: safe.name,
      balance: safe.balance,
      lastTransactionDate: safe.vouchers[0]?.date
    }));
  }

  /**
   * Get installment status summary
   */
  static async getInstallmentStatusSummary(): Promise<InstallmentStatusSummary> {
    const [pending, paid, overdue, totalAmount, paidAmount] = await Promise.all([
      prisma.installment.count({
        where: { 
          deletedAt: null,
          status: 'معلق',
          dueDate: { gte: new Date() }
        }
      }),
      
      prisma.installment.count({
        where: { 
          deletedAt: null,
          status: 'مدفوع'
        }
      }),
      
      prisma.installment.count({
        where: { 
          deletedAt: null,
          status: 'معلق',
          dueDate: { lt: new Date() }
        }
      }),
      
      prisma.installment.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      
      prisma.installment.aggregate({
        where: { 
          deletedAt: null,
          status: 'مدفوع'
        },
        _sum: { amount: true }
      })
    ]);

    const total = pending + paid + overdue;
    const totalAmountValue = totalAmount._sum.amount || 0;
    const paidAmountValue = paidAmount._sum.amount || 0;
    const pendingAmount = totalAmountValue - paidAmountValue;
    const overdueAmount = await this.calculateOverdueAmount();

    return {
      pending,
      paid,
      overdue,
      total,
      totalAmount: totalAmountValue,
      paidAmount: paidAmountValue,
      pendingAmount,
      overdueAmount
    };
  }

  /**
   * Calculate overdue amount
   */
  private static async calculateOverdueAmount(): Promise<number> {
    const overdueInstallments = await prisma.installment.aggregate({
      where: { 
        deletedAt: null,
        status: 'معلق',
        dueDate: { lt: new Date() }
      },
      _sum: { amount: true }
    });

    return overdueInstallments._sum.amount || 0;
  }

  /**
   * Calculate unit profit/loss
   */
  static async calculateUnitProfitLoss(unitId: string): Promise<{
    totalInvestment: number;
    totalRevenue: number;
    profitLoss: number;
    profitMargin: number;
  }> {
    const [unit, contracts, vouchers] = await Promise.all([
      prisma.unit.findUnique({
        where: { id: unitId }
      }),
      
      prisma.contract.findMany({
        where: { 
          unitId,
          deletedAt: null
        }
      }),
      
      prisma.voucher.findMany({
        where: { 
          linkedRef: unitId,
          deletedAt: null
        }
      })
    ]);

    if (!unit) {
      throw new Error('Unit not found');
    }

    const totalInvestment = unit.totalPrice;
    const totalRevenue = vouchers
      .filter(v => v.type === 'receipt')
      .reduce((sum, v) => sum + v.amount, 0);
    
    const profitLoss = totalRevenue - totalInvestment;
    const profitMargin = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalRevenue,
      profitLoss,
      profitMargin
    };
  }

  /**
   * Calculate partner share
   */
  static async calculatePartnerShare(partnerId: string): Promise<{
    totalUnits: number;
    totalInvestment: number;
    totalRevenue: number;
    partnerShare: number;
    partnerRevenue: number;
  }> {
    const [unitPartners, partnerGroupPartners] = await Promise.all([
      prisma.unitPartner.findMany({
        where: { 
          partnerId,
          deletedAt: null
        },
        include: {
          unit: true
        }
      }),
      
      prisma.partnerGroupPartner.findMany({
        where: { 
          partnerId,
          deletedAt: null
        },
        include: {
          partnerGroup: {
            include: {
              unitPartnerGroups: {
                include: {
                  unit: true
                }
              }
            }
          }
        }
      })
    ]);

    let totalUnits = 0;
    let totalInvestment = 0;
    let totalRevenue = 0;
    let partnerShare = 0;
    let partnerRevenue = 0;

    // Calculate from direct unit partnerships
    for (const unitPartner of unitPartners) {
      totalUnits++;
      totalInvestment += unitPartner.unit.totalPrice;
      partnerShare += unitPartner.percentage;
      
      // Get revenue from vouchers for this unit
      const unitVouchers = await prisma.voucher.findMany({
        where: { 
          linkedRef: unitPartner.unitId,
          deletedAt: null,
          type: 'receipt'
        }
      });
      
      const unitRevenue = unitVouchers.reduce((sum, v) => sum + v.amount, 0);
      totalRevenue += unitRevenue;
      partnerRevenue += unitRevenue * (unitPartner.percentage / 100);
    }

    // Calculate from partner group partnerships
    for (const groupPartner of partnerGroupPartners) {
      for (const unitGroup of groupPartner.partnerGroup.unitPartnerGroups) {
        if (unitGroup.deletedAt) continue;
        
        totalUnits++;
        totalInvestment += unitGroup.unit.totalPrice;
        partnerShare += groupPartner.percentage;
        
        // Get revenue from vouchers for this unit
        const unitVouchers = await prisma.voucher.findMany({
          where: { 
            linkedRef: unitGroup.unitId,
            deletedAt: null,
            type: 'receipt'
          }
        });
        
        const unitRevenue = unitVouchers.reduce((sum, v) => sum + v.amount, 0);
        totalRevenue += unitRevenue;
        partnerRevenue += unitRevenue * (groupPartner.percentage / 100);
      }
    }

    return {
      totalUnits,
      totalInvestment,
      totalRevenue,
      partnerShare,
      partnerRevenue
    };
  }
}