export interface CreateContractData {
  type: 'rent' | 'sale';
  startDate: Date;
  endDate?: Date;
  rentAmount?: number;
  salePrice?: number;
  propertyId: number;
  tenantId?: number;
}

export interface UpdateContractData {
  type?: 'rent' | 'sale';
  startDate?: Date;
  endDate?: Date;
  rentAmount?: number;
  salePrice?: number;
  status?: 'active' | 'expired' | 'terminated';
}

export interface ContractWithDetails {
  id: number;
  type: string;
  startDate: Date;
  endDate?: Date;
  rentAmount?: number;
  salePrice?: number;
  status: string;
  propertyId: number;
  tenantId?: number;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: number;
    title: string;
    address: string;
    type: string;
  };
  tenant?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  payments?: Array<{
    id: number;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
  }>;
}

export interface ContractSummary {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  totalRentIncome: number;
  totalSalesRevenue: number;
}