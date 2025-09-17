import prisma from '../config/database';
import { Customer, CustomerCreateRequest, CustomerUpdateRequest, SearchQuery } from '../types';

export class CustomerService {
  /**
   * Get all customers with pagination and search
   */
  static async getAllCustomers(query: SearchQuery): Promise<{
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get customers and total count
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ]);

    return {
      customers: customers.map(customer => ({
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        deletedAt: customer.deletedAt?.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: {
        contracts: {
          where: { deletedAt: null },
          include: {
            unit: true
          }
        }
      }
    });

    if (!customer) return null;

    return {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      deletedAt: customer.deletedAt?.toISOString()
    };
  }

  /**
   * Create new customer
   */
  static async createCustomer(data: CustomerCreateRequest): Promise<Customer> {
    // Check for duplicate phone or national ID
    if (data.phone || data.nationalId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          deletedAt: null,
          OR: [
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.nationalId ? [{ nationalId: data.nationalId }] : [])
          ]
        }
      });

      if (existingCustomer) {
        throw new Error('Customer with this phone or national ID already exists');
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        nationalId: data.nationalId,
        address: data.address,
        status: data.status || 'نشط',
        notes: data.notes
      }
    });

    return {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      deletedAt: customer.deletedAt?.toISOString()
    };
  }

  /**
   * Update customer
   */
  static async updateCustomer(id: string, data: CustomerUpdateRequest): Promise<Customer | null> {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingCustomer) return null;

    // Check for duplicate phone or national ID (excluding current customer)
    if (data.phone || data.nationalId) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          OR: [
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.nationalId ? [{ nationalId: data.nationalId }] : [])
          ]
        }
      });

      if (duplicateCustomer) {
        throw new Error('Customer with this phone or national ID already exists');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    return {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      deletedAt: customer.deletedAt?.toISOString()
    };
  }

  /**
   * Delete customer (soft delete)
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    const customer = await prisma.customer.findUnique({
      where: { id, deletedAt: null }
    });

    if (!customer) return false;

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Get customer contracts
   */
  static async getCustomerContracts(customerId: string): Promise<any[]> {
    const contracts = await prisma.contract.findMany({
      where: {
        customerId,
        deletedAt: null
      },
      include: {
        unit: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return contracts.map(contract => ({
      ...contract,
      start: contract.start.toISOString(),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      deletedAt: contract.deletedAt?.toISOString()
    }));
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(customerId: string): Promise<{
    totalContracts: number;
    totalValue: number;
    paidAmount: number;
    pendingAmount: number;
    lastContractDate?: string;
  }> {
    const [contracts, vouchers] = await Promise.all([
      prisma.contract.findMany({
        where: { customerId, deletedAt: null }
      }),
      prisma.voucher.findMany({
        where: {
          linkedRef: customerId,
          deletedAt: null,
          type: 'receipt'
        }
      })
    ]);

    const totalContracts = contracts.length;
    const totalValue = contracts.reduce((sum, contract) => sum + contract.totalPrice, 0);
    const paidAmount = vouchers.reduce((sum, voucher) => sum + voucher.amount, 0);
    const pendingAmount = totalValue - paidAmount;
    const lastContractDate = contracts.length > 0 
      ? contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString()
      : undefined;

    return {
      totalContracts,
      totalValue,
      paidAmount,
      pendingAmount,
      lastContractDate
    };
  }

  /**
   * Search customers
   */
  static async searchCustomers(searchTerm: string): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { nationalId: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    return customers.map(customer => ({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      deletedAt: customer.deletedAt?.toISOString()
    }));
  }

  /**
   * Get customers by status
   */
  static async getCustomersByStatus(status: string): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: {
        status,
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });

    return customers.map(customer => ({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      deletedAt: customer.deletedAt?.toISOString()
    }));
  }
}