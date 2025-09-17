import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination query parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search query parameters
export interface SearchQuery extends PaginationQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalCustomers: number;
  totalUnits: number;
  totalContracts: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeInstallments: number;
  overdueInstallments: number;
  totalSafes: number;
  totalSafesBalance: number;
}

// Financial calculations
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

// Safe balance information
export interface SafeBalance {
  safeId: string;
  safeName: string;
  balance: number;
  lastTransactionDate?: Date;
}

// Installment status summary
export interface InstallmentStatusSummary {
  pending: number;
  paid: number;
  overdue: number;
  total: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Audit log entry
export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}