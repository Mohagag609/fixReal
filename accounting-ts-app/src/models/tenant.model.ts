export interface CreateTenantData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
}

export interface UpdateTenantData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  isActive?: boolean;
}

export interface TenantWithDetails {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contracts?: Array<{
    id: number;
    type: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    property: {
      id: number;
      title: string;
      address: string;
    };
  }>;
  payments?: Array<{
    id: number;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
  }>;
}

export interface TenantSummary {
  totalTenants: number;
  activeTenants: number;
  totalRentPaid: number;
  averageRentAmount: number;
}