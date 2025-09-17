export interface Broker {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  commission_rate: number;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerStats {
  total: number;
  active: number;
  inactive: number;
  total_commission: number;
  average_commission: number;
}