export interface Contract {
  id: number;
  unit_id: number;
  customer_id: number;
  start: string;
  total_price: number;
  discount_amount: number;
  broker_name?: string;
  broker_percent: number;
  broker_amount: number;
  commission_safe_id?: string;
  down_payment_safe_id?: string;
  maintenance_deposit: number;
  installment_type: string;
  installment_count: number;
  extra_annual: number;
  annual_payment_value: number;
  down_payment: number;
  payment_type: string;
  created_at: string;
  updated_at: string;
  unit?: {
    id: number;
    code: string;
    name?: string;
    unit_type: string;
    total_price: number;
  };
  customer?: {
    id: number;
    name: string;
    phone?: string;
    national_id?: string;
  };
}

export interface ContractFormData {
  unit_id: number;
  customer_id: number;
  start: string;
  total_price: number;
  discount_amount?: number;
  broker_name?: string;
  broker_percent?: number;
  broker_amount?: number;
  commission_safe_id?: string;
  down_payment_safe_id?: string;
  maintenance_deposit?: number;
  installment_type?: string;
  installment_count?: number;
  extra_annual?: number;
  annual_payment_value?: number;
  down_payment?: number;
  payment_type?: string;
}

export interface ContractFilters {
  search?: string;
  start_date?: string;
  end_date?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
}

export interface ContractResponse {
  success: boolean;
  data: Contract[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}