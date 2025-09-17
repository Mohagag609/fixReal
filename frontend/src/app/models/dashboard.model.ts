export interface DashboardKPIs {
  total_contracts: number;
  total_contract_value: number;
  total_vouchers: number;
  total_voucher_amount: number;
  paid_installments: number;
  pending_installments: number;
  total_units: number;
  active_units: number;
  total_customers: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardKPIs;
}