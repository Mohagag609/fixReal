export interface Installment {
  id: number;
  unit_id: number;
  amount: number;
  due_date: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  unit?: {
    id: number;
    code: string;
    name?: string;
    unit_type: string;
  };
  is_overdue?: boolean;
  days_overdue?: number;
}

export interface InstallmentFormData {
  unit_id: number;
  amount: number;
  due_date: string;
  status?: string;
  notes?: string;
}

export interface InstallmentFilters {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  per_page?: number;
}

export interface InstallmentResponse {
  success: boolean;
  data: Installment[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PaymentData {
  safe_id: number;
  payer?: string;
  beneficiary?: string;
  notes?: string;
}