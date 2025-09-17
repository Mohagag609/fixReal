export interface Customer {
  id: number;
  name: string;
  phone?: string;
  national_id?: string;
  address?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contracts_count?: number;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  national_id?: string;
  address?: string;
  status?: string;
  notes?: string;
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface CustomerResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}