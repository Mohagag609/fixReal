export interface PartnerDebt {
  id: string;
  partner_id: string;
  unit_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
  partner?: Partner;
  unit?: Unit;
}

export interface Partner {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerDebtStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  total_amount: number;
  pending_amount: number;
  paid_amount: number;
  overdue_amount: number;
}