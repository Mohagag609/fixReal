export interface CreateInvoiceData {
  invoiceNumber: string;
  customer: string;
  amount: number;
  tax?: number;
  total?: number;
  dueDate: Date;
  description?: string;
  propertyId?: number;
}

export interface UpdateInvoiceData {
  customer?: string;
  amount?: number;
  tax?: number;
  total?: number;
  status?: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  dueDate?: Date;
  description?: string;
}

export interface InvoiceWithDetails {
  id: number;
  invoiceNumber: string;
  customer: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  dueDate: Date;
  description?: string;
  propertyId?: number;
  createdAt: Date;
  updatedAt: Date;
  property?: {
    id: number;
    title: string;
    address: string;
  };
  payments?: Array<{
    id: number;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
  }>;
}

export interface InvoiceSummary {
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}