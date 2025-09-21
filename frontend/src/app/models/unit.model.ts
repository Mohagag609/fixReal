export interface Unit {
  id: number;
  code: string;
  name?: string;
  unit_type: string;
  area?: string;
  floor?: string;
  building?: string;
  total_price: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contracts_count?: number;
  installments_count?: number;
}

export interface UnitFormData {
  code: string;
  name?: string;
  unit_type: string;
  area?: string;
  floor?: string;
  building?: string;
  total_price: number;
  status?: string;
  notes?: string;
}

export interface UnitFilters {
  search?: string;
  status?: string;
  unit_type?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
}

export interface UnitResponse {
  success: boolean;
  data: Unit[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}