export interface CreatePaymentData {
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  reference?: string;
  invoiceId?: number;
  contractId?: number;
  tenantId?: number;
}

export interface UpdatePaymentData {
  amount?: number;
  method?: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  reference?: string;
  status?: 'completed' | 'pending' | 'failed';
}

export interface PaymentWithDetails {
  id: number;
  amount: number;
  method: string;
  reference?: string;
  status: string;
  invoiceId?: number;
  contractId?: number;
  tenantId?: number;
  createdAt: Date;
  updatedAt: Date;
  invoice?: {
    id: number;
    invoiceNumber: string;
    customer: string;
    total: number;
  };
  contract?: {
    id: number;
    type: string;
    property: {
      id: number;
      title: string;
      address: string;
    };
  };
  tenant?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface PaymentSummary {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
  paymentsByMethod: Record<string, number>;
  paymentsByMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}