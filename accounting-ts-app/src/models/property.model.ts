export interface CreatePropertyData {
  title: string;
  description?: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land';
  status?: 'available' | 'rented' | 'sold' | 'maintenance';
  price: number;
  rentPrice?: number;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  accountId: number;
}

export interface UpdatePropertyData {
  title?: string;
  description?: string;
  address?: string;
  type?: 'apartment' | 'house' | 'commercial' | 'land';
  status?: 'available' | 'rented' | 'sold' | 'maintenance';
  price?: number;
  rentPrice?: number;
  area?: number;
  rooms?: number;
  bathrooms?: number;
}

export interface PropertyWithDetails {
  id: number;
  title: string;
  description?: string;
  address: string;
  type: string;
  status: string;
  price: number;
  rentPrice?: number;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  accountId: number;
  createdAt: Date;
  updatedAt: Date;
  account: {
    id: number;
    name: string;
    type: string;
  };
  contracts?: Array<{
    id: number;
    type: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    rentAmount?: number;
    salePrice?: number;
  }>;
}

export interface PropertySummary {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  soldProperties: number;
  totalValue: number;
  totalRentIncome: number;
}