export interface BrokerDue {
  id: string;
  broker_id: string;
  contract_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
  broker?: Broker;
  contract?: Contract;
}

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

export interface Contract {
  id: string;
  customer_id: string;
  unit_id: string;
  total_price: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}