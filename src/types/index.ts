// Types مطابقة لـ golden-dataset.json بالحرف

export interface Customer {
  id: string
  name: string
  phone?: string | null
  nationalId?: string | null
  address?: string | null
  status: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
}

export interface Unit {
  id: string
  code: string
  name?: string | null
  unitType: string
  area?: string | null
  floor?: string | null
  building?: string | null
  totalPrice: number
  status: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
}

export interface Partner {
  id: string
  name: string
  phone?: string | null
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
}

export interface UnitPartner {
  id: string
  unitId: string
  partnerId: string
  percentage: number
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
}

export interface Contract {
  id: string
  unitId: string
  customerId: string
  start: Date | string
  totalPrice: number
  discountAmount: number
  brokerName?: string | null
  brokerPercent: number
  brokerAmount: number
  commissionSafeId?: string | null
  downPaymentSafeId?: string | null
  maintenanceDeposit: number
  installmentType: string
  installmentCount: number
  extraAnnual: number
  annualPaymentValue: number
  downPayment: number
  paymentType: string
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  // Relations
  unit?: Unit | null | null
  customer?: Customer | null
  commissionSafe?: Safe | null
}

export interface Installment {
  id: string
  unitId: string
  amount: number
  dueDate: Date | string
  status: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  // Relations
  unit?: Unit | null
}

export interface PartnerDebt {
  id: string
  partnerId: string
  amount: number
  dueDate: Date | string
  status: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  // Relations
  partner?: Partner | null
}

export interface Safe {
  id: string
  name: string
  balance: number
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
}

export interface Transfer {
  id: string
  fromSafeId: string
  toSafeId: string
  amount: number
  description?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
}

export interface Voucher {
  id: string
  type: string
  date: Date | string
  amount: number
  safeId: string
  description: string
  payer?: string | null
  beneficiary?: string | null
  linkedRef?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  // Relations
  safe?: Safe | null
  unit?: Unit | null
}

export interface Broker {
  id: string
  name: string
  phone?: string | null
  notes?: string | null
  commissionRate?: number
  status?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  // Relations
  brokerDues?: BrokerDue[] | null
}

export interface BrokerDue {
  id: string
  brokerId: string
  amount: number
  dueDate: Date | string
  status: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  // Relations
  broker?: Broker | null
}

export interface PartnerGroup {
  id: string
  name: string
  notes?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  deletedAt?: Date | string | null
  partners?: Array<{
    partnerId: string
    percentage: number
    partner?: {
      id: string
      name: string
      phone?: string
    }
  }>
}

export interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValues?: string
  newValues?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface Settings {
  id: string
  key: string
  value: string
}

export interface KeyVal {
  id: string
  key: string
  value: string
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    limit: number
    nextCursor?: string | null
    hasMore: boolean
  }
  error?: string
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalContracts: number
  totalVouchers: number
  totalInstallments: number
  totalUnits: number
  totalCustomers: number
  totalContractValue: number
  totalVoucherAmount: number
  paidInstallments: number
  pendingInstallments: number
  activeUnits: number
  inactiveUnits: number
  totalSales: number
  totalReceipts: number
  totalExpenses: number
  netProfit: number
}

// Date Filter
export interface DateFilter {
  from?: string
  to?: string
}

// User Types
export interface User {
  id: string
  username: string
  role: 'admin' | 'user'
}

// Notification Types
export interface Notification {
  id: string
  type: 'critical' | 'important' | 'info'
  title: string
  message: string
  category: string
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
  createdAt: string
  expiresAt?: string
  data?: Record<string, unknown>
}