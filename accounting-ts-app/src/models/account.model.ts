export interface CreateAccountData {
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
  balance?: number;
}

export interface UpdateAccountData {
  name?: string;
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
  isActive?: boolean;
}

export interface AccountWithBalance {
  id: number;
  name: string;
  type: string;
  balance: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netWorth: number;
}