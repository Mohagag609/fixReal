import prisma from '../config/database';

export class ReportService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    totalCustomers: number;
    totalUnits: number;
    totalContracts: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    availableUnits: number;
    reservedUnits: number;
    soldUnits: number;
    pendingInstallments: number;
    overdueInstallments: number;
  }> {
    const [
      totalCustomers,
      totalUnits,
      totalContracts,
      revenueData,
      expenseData,
      unitStats,
      installmentStats
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { deletedAt: null } }),
      prisma.contract.count({ where: { deletedAt: null } }),
      prisma.voucher.aggregate({
        where: { type: 'receipt', deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.voucher.aggregate({
        where: { type: 'payment', deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.unit.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true
      }),
      prisma.installment.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true
      })
    ]);

    const totalRevenue = revenueData._sum.amount || 0;
    const totalExpenses = expenseData._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;

    const availableUnits = unitStats.find(u => u.status === 'متاحة')?._count || 0;
    const reservedUnits = unitStats.find(u => u.status === 'محجوزة')?._count || 0;
    const soldUnits = unitStats.find(u => u.status === 'مباعة')?._count || 0;

    const pendingInstallments = installmentStats.find(i => i.status === 'معلق')?._count || 0;
    const overdueInstallments = await prisma.installment.count({
      where: {
        status: 'معلق',
        dueDate: { lt: new Date() },
        deletedAt: null
      }
    });

    return {
      totalCustomers,
      totalUnits,
      totalContracts,
      totalRevenue,
      totalExpenses,
      netProfit,
      availableUnits,
      reservedUnits,
      soldUnits,
      pendingInstallments,
      overdueInstallments
    };
  }

  /**
   * Get financial summary
   */
  static async getFinancialSummary(startDate?: string, endDate?: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueByMonth: Array<{ month: string; amount: number }>;
    expenseByMonth: Array<{ month: string; amount: number }>;
    topRevenueSources: Array<{ source: string; amount: number }>;
    topExpenseCategories: Array<{ category: string; amount: number }>;
  }> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [revenueData, expenseData, revenueByMonth, expenseByMonth] = await Promise.all([
      prisma.voucher.aggregate({
        where: { type: 'receipt', deletedAt: null, ...dateFilter },
        _sum: { amount: true }
      }),
      prisma.voucher.aggregate({
        where: { type: 'payment', deletedAt: null, ...dateFilter },
        _sum: { amount: true }
      }),
      this.getRevenueByMonth(startDate, endDate),
      this.getExpenseByMonth(startDate, endDate)
    ]);

    const totalRevenue = revenueData._sum.amount || 0;
    const totalExpenses = expenseData._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;

    const topRevenueSources = await this.getTopRevenueSources(startDate, endDate);
    const topExpenseCategories = await this.getTopExpenseCategories(startDate, endDate);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      revenueByMonth,
      expenseByMonth,
      topRevenueSources,
      topExpenseCategories
    };
  }

  /**
   * Get sales report
   */
  static async getSalesReport(startDate?: string, endDate?: string, groupBy?: string): Promise<{
    totalSales: number;
    totalContracts: number;
    averageContractValue: number;
    salesByPeriod: Array<{ period: string; amount: number; count: number }>;
    salesByUnitType: Array<{ unitType: string; amount: number; count: number }>;
    salesByBroker: Array<{ broker: string; amount: number; count: number }>;
  }> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [contracts, salesByPeriod, salesByUnitType, salesByBroker] = await Promise.all([
      prisma.contract.findMany({
        where: { deletedAt: null, ...dateFilter },
        include: { unit: true }
      }),
      this.getSalesByPeriod(startDate, endDate, groupBy),
      this.getSalesByUnitType(startDate, endDate),
      this.getSalesByBroker(startDate, endDate)
    ]);

    const totalSales = contracts.reduce((sum, contract) => sum + contract.totalPrice, 0);
    const totalContracts = contracts.length;
    const averageContractValue = totalContracts > 0 ? totalSales / totalContracts : 0;

    return {
      totalSales,
      totalContracts,
      averageContractValue,
      salesByPeriod,
      salesByUnitType,
      salesByBroker
    };
  }

  /**
   * Get customer report
   */
  static async getCustomerReport(startDate?: string, endDate?: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    customersByStatus: Array<{ status: string; count: number }>;
    topCustomers: Array<{ customer: string; totalValue: number; contractCount: number }>;
  }> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [customers, customersByStatus, topCustomers] = await Promise.all([
      prisma.customer.findMany({
        where: { deletedAt: null, ...dateFilter }
      }),
      prisma.customer.groupBy({
        by: ['status'],
        where: { deletedAt: null, ...dateFilter },
        _count: true
      }),
      this.getTopCustomers(startDate, endDate)
    ]);

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'نشط').length;
    const newCustomers = customers.filter(c => {
      const createdDate = new Date(c.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      customersByStatus,
      topCustomers
    };
  }

  /**
   * Get unit report
   */
  static async getUnitReport(startDate?: string, endDate?: string): Promise<{
    totalUnits: number;
    availableUnits: number;
    reservedUnits: number;
    soldUnits: number;
    unitsByType: Array<{ unitType: string; count: number; totalValue: number }>;
    unitsByBuilding: Array<{ building: string; count: number; totalValue: number }>;
    topUnits: Array<{ unit: string; totalValue: number; contractCount: number }>;
  }> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [units, unitsByType, unitsByBuilding, topUnits] = await Promise.all([
      prisma.unit.findMany({
        where: { deletedAt: null, ...dateFilter }
      }),
      this.getUnitsByType(startDate, endDate),
      this.getUnitsByBuilding(startDate, endDate),
      this.getTopUnits(startDate, endDate)
    ]);

    const totalUnits = units.length;
    const availableUnits = units.filter(u => u.status === 'متاحة').length;
    const reservedUnits = units.filter(u => u.status === 'محجوزة').length;
    const soldUnits = units.filter(u => u.status === 'مباعة').length;

    return {
      totalUnits,
      availableUnits,
      reservedUnits,
      soldUnits,
      unitsByType,
      unitsByBuilding,
      topUnits
    };
  }

  /**
   * Get installment report
   */
  static async getInstallmentReport(startDate?: string, endDate?: string, status?: string): Promise<{
    totalInstallments: number;
    paidInstallments: number;
    pendingInstallments: number;
    overdueInstallments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    installmentsByStatus: Array<{ status: string; count: number; amount: number }>;
    installmentsByMonth: Array<{ month: string; count: number; amount: number }>;
  }> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const statusFilter = status ? { status } : {};

    const [installments, installmentsByStatus, installmentsByMonth] = await Promise.all([
      prisma.installment.findMany({
        where: { deletedAt: null, ...dateFilter, ...statusFilter }
      }),
      prisma.installment.groupBy({
        by: ['status'],
        where: { deletedAt: null, ...dateFilter },
        _count: true,
        _sum: { amount: true }
      }),
      this.getInstallmentsByMonth(startDate, endDate)
    ]);

    const totalInstallments = installments.length;
    const paidInstallments = installments.filter(i => i.status === 'مدفوع').length;
    const pendingInstallments = installments.filter(i => i.status === 'معلق').length;
    const overdueInstallments = installments.filter(i => 
      i.status === 'معلق' && i.dueDate < new Date()
    ).length;

    const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
    const paidAmount = installments
      .filter(i => i.status === 'مدفوع')
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = installments
      .filter(i => i.status === 'معلق')
      .reduce((sum, i) => sum + i.amount, 0);
    const overdueAmount = installments
      .filter(i => i.status === 'معلق' && i.dueDate < new Date())
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      overdueInstallments,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      installmentsByStatus,
      installmentsByMonth
    };
  }

  /**
   * Get safe report
   */
  static async getSafeReport(startDate?: string, endDate?: string, safeId?: string): Promise<{
    totalBalance: number;
    safeBalances: Array<{ safe: string; balance: number; transactionCount: number }>;
    transactionsBySafe: Array<{ safe: string; receipts: number; payments: number; netAmount: number }>;
    transactionsByType: Array<{ type: string; count: number; amount: number }>;
  }> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const safeFilter = safeId ? { safeId } : {};

    const [safes, transactions, transactionsBySafe, transactionsByType] = await Promise.all([
      prisma.safe.findMany({
        where: { deletedAt: null }
      }),
      prisma.voucher.findMany({
        where: { deletedAt: null, ...dateFilter, ...safeFilter },
        include: { safe: true }
      }),
      this.getTransactionsBySafe(startDate, endDate),
      prisma.voucher.groupBy({
        by: ['type'],
        where: { deletedAt: null, ...dateFilter, ...safeFilter },
        _count: true,
        _sum: { amount: true }
      })
    ]);

    const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0);

    const safeBalances = safes.map(safe => ({
      safe: safe.name,
      balance: safe.balance,
      transactionCount: transactions.filter(t => t.safeId === safe.id).length
    }));

    return {
      totalBalance,
      safeBalances,
      transactionsBySafe,
      transactionsByType
    };
  }

  /**
   * Export report to PDF
   */
  static async exportReportPDF(reportType: string, startDate?: string, endDate?: string): Promise<Buffer> {
    // This would integrate with a PDF generation library like puppeteer or pdfkit
    // For now, return a simple text representation
    const reportData = await this.getReportData(reportType, startDate, endDate);
    const reportText = `
      تقرير ${reportType}
      ===================
      
      الفترة: ${startDate || 'بداية'} إلى ${endDate || 'النهاية'}
      
      البيانات:
      ${JSON.stringify(reportData, null, 2)}
    `;

    return Buffer.from(reportText, 'utf-8');
  }

  /**
   * Export report to Excel
   */
  static async exportReportExcel(reportType: string, startDate?: string, endDate?: string): Promise<Buffer> {
    // This would integrate with an Excel generation library like exceljs
    // For now, return a simple text representation
    const reportData = await this.getReportData(reportType, startDate, endDate);
    const reportText = `
      تقرير ${reportType}
      ===================
      
      الفترة: ${startDate || 'بداية'} إلى ${endDate || 'النهاية'}
      
      البيانات:
      ${JSON.stringify(reportData, null, 2)}
    `;

    return Buffer.from(reportText, 'utf-8');
  }

  // Helper methods
  private static buildDateFilter(startDate?: string, endDate?: string): any {
    if (!startDate && !endDate) return {};
    
    const filter: any = {};
    if (startDate) filter.gte = new Date(startDate);
    if (endDate) filter.lte = new Date(endDate);
    
    return { createdAt: filter };
  }

  private static async getRevenueByMonth(startDate?: string, endDate?: string): Promise<Array<{ month: string; amount: number }>> {
    const revenue = await prisma.voucher.groupBy({
      by: ['date'],
      where: {
        type: 'receipt',
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { amount: true }
    });

    return revenue.map(r => ({
      month: r.date.toISOString().substring(0, 7),
      amount: r._sum.amount || 0
    }));
  }

  private static async getExpenseByMonth(startDate?: string, endDate?: string): Promise<Array<{ month: string; amount: number }>> {
    const expenses = await prisma.voucher.groupBy({
      by: ['date'],
      where: {
        type: 'payment',
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { amount: true }
    });

    return expenses.map(e => ({
      month: e.date.toISOString().substring(0, 7),
      amount: e._sum.amount || 0
    }));
  }

  private static async getTopRevenueSources(startDate?: string, endDate?: string): Promise<Array<{ source: string; amount: number }>> {
    const sources = await prisma.voucher.groupBy({
      by: ['description'],
      where: {
        type: 'receipt',
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    return sources.map(s => ({
      source: s.description,
      amount: s._sum.amount || 0
    }));
  }

  private static async getTopExpenseCategories(startDate?: string, endDate?: string): Promise<Array<{ category: string; amount: number }>> {
    const categories = await prisma.voucher.groupBy({
      by: ['description'],
      where: {
        type: 'payment',
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    return categories.map(c => ({
      category: c.description,
      amount: c._sum.amount || 0
    }));
  }

  private static async getSalesByPeriod(startDate?: string, endDate?: string, groupBy?: string): Promise<Array<{ period: string; amount: number; count: number }>> {
    // Implementation for sales by period
    return [];
  }

  private static async getSalesByUnitType(startDate?: string, endDate?: string): Promise<Array<{ unitType: string; amount: number; count: number }>> {
    const sales = await prisma.contract.groupBy({
      by: ['unit'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { totalPrice: true },
      _count: true
    });

    return sales.map(s => ({
      unitType: s.unit || 'غير محدد',
      amount: s._sum.totalPrice || 0,
      count: s._count
    }));
  }

  private static async getSalesByBroker(startDate?: string, endDate?: string): Promise<Array<{ broker: string; amount: number; count: number }>> {
    const sales = await prisma.contract.groupBy({
      by: ['brokerName'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { totalPrice: true },
      _count: true
    });

    return sales.map(s => ({
      broker: s.brokerName || 'غير محدد',
      amount: s._sum.totalPrice || 0,
      count: s._count
    }));
  }

  private static async getTopCustomers(startDate?: string, endDate?: string): Promise<Array<{ customer: string; totalValue: number; contractCount: number }>> {
    const customers = await prisma.contract.groupBy({
      by: ['customerId'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { totalPrice: true },
      _count: true
    });

    const customerDetails = await prisma.customer.findMany({
      where: { id: { in: customers.map(c => c.customerId) } }
    });

    return customers.map(c => {
      const customer = customerDetails.find(cd => cd.id === c.customerId);
      return {
        customer: customer?.name || 'غير محدد',
        totalValue: c._sum.totalPrice || 0,
        contractCount: c._count
      };
    });
  }

  private static async getUnitsByType(startDate?: string, endDate?: string): Promise<Array<{ unitType: string; count: number; totalValue: number }>> {
    const units = await prisma.unit.groupBy({
      by: ['unitType'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _count: true,
      _sum: { totalPrice: true }
    });

    return units.map(u => ({
      unitType: u.unitType,
      count: u._count,
      totalValue: u._sum.totalPrice || 0
    }));
  }

  private static async getUnitsByBuilding(startDate?: string, endDate?: string): Promise<Array<{ building: string; count: number; totalValue: number }>> {
    const units = await prisma.unit.groupBy({
      by: ['building'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _count: true,
      _sum: { totalPrice: true }
    });

    return units.map(u => ({
      building: u.building || 'غير محدد',
      count: u._count,
      totalValue: u._sum.totalPrice || 0
    }));
  }

  private static async getTopUnits(startDate?: string, endDate?: string): Promise<Array<{ unit: string; totalValue: number; contractCount: number }>> {
    const units = await prisma.contract.groupBy({
      by: ['unitId'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { totalPrice: true },
      _count: true
    });

    const unitDetails = await prisma.unit.findMany({
      where: { id: { in: units.map(u => u.unitId) } }
    });

    return units.map(u => {
      const unit = unitDetails.find(ud => ud.id === u.unitId);
      return {
        unit: unit?.name || unit?.code || 'غير محدد',
        totalValue: u._sum.totalPrice || 0,
        contractCount: u._count
      };
    });
  }

  private static async getInstallmentsByMonth(startDate?: string, endDate?: string): Promise<Array<{ month: string; count: number; amount: number }>> {
    const installments = await prisma.installment.groupBy({
      by: ['dueDate'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _count: true,
      _sum: { amount: true }
    });

    return installments.map(i => ({
      month: i.dueDate.toISOString().substring(0, 7),
      count: i._count,
      amount: i._sum.amount || 0
    }));
  }

  private static async getTransactionsBySafe(startDate?: string, endDate?: string): Promise<Array<{ safe: string; receipts: number; payments: number; netAmount: number }>> {
    const transactions = await prisma.voucher.groupBy({
      by: ['safeId', 'type'],
      where: {
        deletedAt: null,
        ...this.buildDateFilter(startDate, endDate)
      },
      _sum: { amount: true }
    });

    const safes = await prisma.safe.findMany({
      where: { id: { in: transactions.map(t => t.safeId) } }
    });

    const safeMap = new Map();
    safes.forEach(safe => safeMap.set(safe.id, safe.name));

    const result = new Map();
    transactions.forEach(t => {
      const safeName = safeMap.get(t.safeId) || 'غير محدد';
      if (!result.has(safeName)) {
        result.set(safeName, { safe: safeName, receipts: 0, payments: 0, netAmount: 0 });
      }
      const data = result.get(safeName);
      if (t.type === 'receipt') {
        data.receipts += t._sum.amount || 0;
      } else {
        data.payments += t._sum.amount || 0;
      }
      data.netAmount = data.receipts - data.payments;
    });

    return Array.from(result.values());
  }

  private static async getReportData(reportType: string, startDate?: string, endDate?: string): Promise<any> {
    switch (reportType) {
      case 'financial':
        return await this.getFinancialSummary(startDate, endDate);
      case 'sales':
        return await this.getSalesReport(startDate, endDate);
      case 'customer':
        return await this.getCustomerReport(startDate, endDate);
      case 'unit':
        return await this.getUnitReport(startDate, endDate);
      case 'installment':
        return await this.getInstallmentReport(startDate, endDate);
      case 'safe':
        return await this.getSafeReport(startDate, endDate);
      default:
        return await this.getDashboardStats();
    }
  }
}