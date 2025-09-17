export interface CreateReportData {
  type: 'financial' | 'property' | 'tenant' | 'revenue';
  title: string;
  data: Record<string, any>;
  period: 'daily' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
}

export interface ReportWithDetails {
  id: number;
  type: string;
  title: string;
  data: Record<string, any>;
  period: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface FinancialReport {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByMonth: Array<{
    month: string;
    amount: number;
  }>;
  expensesByCategory: Record<string, number>;
  cashFlow: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export interface PropertyReport {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  soldProperties: number;
  totalValue: number;
  averageRentPrice: number;
  occupancyRate: number;
  propertiesByType: Record<string, number>;
  propertiesByStatus: Record<string, number>;
}

export interface TenantReport {
  totalTenants: number;
  activeTenants: number;
  averageRentAmount: number;
  totalRentCollected: number;
  averageTenancyDuration: number;
  tenantsByProperty: Array<{
    propertyId: number;
    propertyTitle: string;
    tenantCount: number;
    totalRent: number;
  }>;
}

export interface RevenueReport {
  totalRevenue: number;
  rentRevenue: number;
  salesRevenue: number;
  otherRevenue: number;
  revenueByMonth: Array<{
    month: string;
    rent: number;
    sales: number;
    other: number;
    total: number;
  }>;
  revenueByProperty: Array<{
    propertyId: number;
    propertyTitle: string;
    rentRevenue: number;
    salesRevenue: number;
    totalRevenue: number;
  }>;
}