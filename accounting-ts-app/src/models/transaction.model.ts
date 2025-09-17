export interface CreateTransactionData {
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  category?: 'rent' | 'maintenance' | 'utilities' | 'sale' | 'expense';
  accountId: number;
  propertyId?: number;
}

export interface UpdateTransactionData {
  amount?: number;
  type?: 'credit' | 'debit';
  description?: string;
  category?: 'rent' | 'maintenance' | 'utilities' | 'sale' | 'expense';
}

export interface TransactionWithDetails {
  id: number;
  amount: number;
  type: string;
  description: string;
  category?: string;
  accountId: number;
  propertyId?: number;
  createdAt: Date;
  updatedAt: Date;
  account: {
    id: number;
    name: string;
    type: string;
  };
  property?: {
    id: number;
    title: string;
    address: string;
  };
}

export interface TransactionSummary {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionsByCategory: Record<string, number>;
  transactionsByMonth: Array<{
    month: string;
    credits: number;
    debits: number;
    net: number;
  }>;
}