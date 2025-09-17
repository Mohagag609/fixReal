import prisma from '../config/db';
import { CreateReportData, FinancialReport, PropertyReport, TenantReport, RevenueReport } from '../models/report.model';

export class ReportService {
  async createReport(data: CreateReportData) {
    return prisma.report.create({
      data: {
        type: data.type,
        title: data.title,
        data: data.data,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  }

  async getAllReports() {
    return prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportById(id: number) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }

  async getReportsByType(type: string) {
    return prisma.report.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateFinancialReport(startDate: Date, endDate: Date): Promise<FinancialReport> {
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Group revenue by month
    const revenueByMonth = payments.reduce((acc, payment) => {
      const month = payment.createdAt.toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, amount: 0 };
      }
      acc[month].amount += payment.amount;
      return acc;
    }, {} as Record<string, { month: string; amount: number }>);

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate cash flow by month
    const cashFlow = Object.keys(revenueByMonth).map(month => {
      const revenue = revenueByMonth[month].amount;
      const monthExpenses = expenses
        .filter(e => e.createdAt.toISOString().substring(0, 7) === month)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        month,
        inflow: revenue,
        outflow: monthExpenses,
        net: revenue - monthExpenses,
      };
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      revenueByMonth: Object.values(revenueByMonth).sort((a, b) => a.month.localeCompare(b.month)),
      expensesByCategory,
      cashFlow,
    };
  }

  async generatePropertyReport(): Promise<PropertyReport> {
    const properties = await prisma.property.findMany({
      include: {
        contracts: {
          where: { status: 'active' },
        },
      },
    });

    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.status === 'available').length;
    const rentedProperties = properties.filter(p => p.status === 'rented').length;
    const soldProperties = properties.filter(p => p.status === 'sold').length;
    const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
    const averageRentPrice = rentedProperties > 0 
      ? properties
          .filter(p => p.status === 'rented' && p.rentPrice)
          .reduce((sum, p) => sum + (p.rentPrice || 0), 0) / rentedProperties
      : 0;
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

    // Group by type
    const propertiesByType = properties.reduce((acc, property) => {
      acc[property.type] = (acc[property.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const propertiesByStatus = properties.reduce((acc, property) => {
      acc[property.status] = (acc[property.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProperties,
      availableProperties,
      rentedProperties,
      soldProperties,
      totalValue,
      averageRentPrice,
      occupancyRate,
      propertiesByType,
      propertiesByStatus,
    };
  }

  async generateTenantReport(): Promise<TenantReport> {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        contracts: {
          where: { status: 'active' },
          include: {
            property: true,
          },
        },
        payments: {
          where: { status: 'completed' },
        },
      },
    });

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.contracts.length > 0).length;
    const averageRentAmount = activeTenants > 0
      ? tenants.reduce((sum, tenant) => {
          const rentAmount = tenant.contracts.reduce((contractSum, contract) => 
            contractSum + (contract.rentAmount || 0), 0);
          return sum + rentAmount;
        }, 0) / activeTenants
      : 0;
    const totalRentCollected = tenants.reduce((sum, tenant) => {
      return sum + tenant.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);

    // Calculate average tenancy duration
    const tenancyDurations = tenants
      .filter(t => t.contracts.length > 0)
      .map(tenant => {
        const contract = tenant.contracts[0];
        if (!contract) return 0;
        const startDate = new Date(contract.startDate);
        const endDate = contract.endDate ? new Date(contract.endDate) : new Date();
        return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)); // months
      });
    const averageTenancyDuration = tenancyDurations.length > 0
      ? tenancyDurations.reduce((sum, duration) => sum + duration, 0) / tenancyDurations.length
      : 0;

    // Group tenants by property
    const tenantsByProperty = tenants.reduce((acc, tenant) => {
      tenant.contracts.forEach(contract => {
        const propertyId = contract.propertyId;
        const propertyTitle = contract.property.title;
        
        if (!acc[propertyId]) {
          acc[propertyId] = {
            propertyId,
            propertyTitle,
            tenantCount: 0,
            totalRent: 0,
          };
        }
        
        acc[propertyId].tenantCount += 1;
        acc[propertyId].totalRent += contract.rentAmount || 0;
      });
      return acc;
    }, {} as Record<number, { propertyId: number; propertyTitle: string; tenantCount: number; totalRent: number }>);

    return {
      totalTenants,
      activeTenants,
      averageRentAmount,
      totalRentCollected,
      averageTenancyDuration,
      tenantsByProperty: Object.values(tenantsByProperty),
    };
  }

  async generateRevenueReport(startDate: Date, endDate: Date): Promise<RevenueReport> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        contract: {
          include: {
            property: true,
          },
        },
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Separate rent and sales revenue
    const rentRevenue = payments
      .filter(p => p.contract?.type === 'rent')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const salesRevenue = payments
      .filter(p => p.contract?.type === 'sale')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const otherRevenue = totalRevenue - rentRevenue - salesRevenue;

    // Group revenue by month
    const revenueByMonth = payments.reduce((acc, payment) => {
      const month = payment.createdAt.toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, rent: 0, sales: 0, other: 0, total: 0 };
      }
      
      if (payment.contract?.type === 'rent') {
        acc[month].rent += payment.amount;
      } else if (payment.contract?.type === 'sale') {
        acc[month].sales += payment.amount;
      } else {
        acc[month].other += payment.amount;
      }
      
      acc[month].total += payment.amount;
      return acc;
    }, {} as Record<string, { month: string; rent: number; sales: number; other: number; total: number }>);

    // Group revenue by property
    const revenueByProperty = payments.reduce((acc, payment) => {
      if (payment.contract?.property) {
        const propertyId = payment.contract.property.id;
        const propertyTitle = payment.contract.property.title;
        
        if (!acc[propertyId]) {
          acc[propertyId] = {
            propertyId,
            propertyTitle,
            rentRevenue: 0,
            salesRevenue: 0,
            totalRevenue: 0,
          };
        }
        
        if (payment.contract.type === 'rent') {
          acc[propertyId].rentRevenue += payment.amount;
        } else if (payment.contract.type === 'sale') {
          acc[propertyId].salesRevenue += payment.amount;
        }
        
        acc[propertyId].totalRevenue += payment.amount;
      }
      return acc;
    }, {} as Record<number, { propertyId: number; propertyTitle: string; rentRevenue: number; salesRevenue: number; totalRevenue: number }>);

    return {
      totalRevenue,
      rentRevenue,
      salesRevenue,
      otherRevenue,
      revenueByMonth: Object.values(revenueByMonth).sort((a, b) => a.month.localeCompare(b.month)),
      revenueByProperty: Object.values(revenueByProperty),
    };
  }

  async deleteReport(id: number) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new Error('Report not found');
    }

    return prisma.report.delete({ where: { id } });
  }
}