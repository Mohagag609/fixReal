export interface CreateExpenseData {
  amount: number;
  category: 'maintenance' | 'utilities' | 'insurance' | 'taxes' | 'other';
  description: string;
  propertyId?: number;
  accountId: number;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: 'maintenance' | 'utilities' | 'insurance' | 'taxes' | 'other';
  description?: string;
}

export interface ExpenseWithDetails {
  id: number;
  amount: number;
  category: string;
  description: string;
  propertyId?: number;
  accountId: number;
  createdAt: Date;
  updatedAt: Date;
  property?: {
    id: number;
    title: string;
    address: string;
  };
  account: {
    id: number;
    name: string;
    type: string;
  };
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: Record<string, number>;
  expensesByProperty: Array<{
    propertyId: number;
    propertyTitle: string;
    totalAmount: number;
    count: number;
  }>;
  expensesByMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}