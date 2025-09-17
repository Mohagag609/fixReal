// User models
export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Dashboard models
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

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface SafeBalance {
  safeId: string;
  safeName: string;
  balance: number;
  lastTransactionDate?: string;
}

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

// Customer models
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CustomerCreateRequest {
  name: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  status?: string;
  notes?: string;
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  id: string;
}

// Unit models
export interface Unit {
  id: string;
  code: string;
  name?: string;
  unitType: string;
  area?: string;
  floor?: string;
  building?: string;
  totalPrice: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UnitCreateRequest {
  code: string;
  name?: string;
  unitType?: string;
  area?: string;
  floor?: string;
  building?: string;
  totalPrice?: number;
  status?: string;
  notes?: string;
}

export interface UnitUpdateRequest extends Partial<UnitCreateRequest> {
  id: string;
}

// Contract models
export interface Contract {
  id: string;
  unitId: string;
  customerId: string;
  start: string;
  totalPrice: number;
  discountAmount: number;
  brokerName?: string;
  brokerPercent: number;
  brokerAmount: number;
  commissionSafeId?: string;
  downPaymentSafeId?: string;
  maintenanceDeposit: number;
  installmentType: string;
  installmentCount: number;
  extraAnnual: number;
  annualPaymentValue: number;
  downPayment: number;
  paymentType: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  unit?: Unit;
  customer?: Customer;
}

export interface ContractCreateRequest {
  unitId: string;
  customerId: string;
  start: string;
  totalPrice: number;
  discountAmount?: number;
  brokerName?: string;
  brokerPercent?: number;
  brokerAmount?: number;
  commissionSafeId?: string;
  downPaymentSafeId?: string;
  maintenanceDeposit?: number;
  installmentType?: string;
  installmentCount?: number;
  extraAnnual?: number;
  annualPaymentValue?: number;
  downPayment?: number;
  paymentType?: string;
}

export interface ContractUpdateRequest extends Partial<ContractCreateRequest> {
  id: string;
}

// Transaction models
export interface Transaction {
  id: string;
  type: string;
  date: string;
  amount: number;
  safeId: string;
  description: string;
  payer?: string;
  beneficiary?: string;
  linkedRef?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  safe?: Safe;
}

export interface TransactionCreateRequest {
  type: string;
  date: string;
  amount: number;
  safeId: string;
  description: string;
  payer?: string;
  beneficiary?: string;
  linkedRef?: string;
}

export interface TransactionUpdateRequest extends Partial<TransactionCreateRequest> {
  id: string;
}

// Safe models
export interface Safe {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SafeCreateRequest {
  name: string;
  balance?: number;
}

export interface SafeUpdateRequest extends Partial<SafeCreateRequest> {
  id: string;
}

// API Response models
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

// Pagination models
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Notification models
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}