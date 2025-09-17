import prisma from '../config/database';
import { Broker, BrokerCreateRequest, BrokerUpdateRequest, SearchQuery } from '../types';

export class BrokerService {
  /**
   * Get all brokers with pagination and search
   */
  static async getAllBrokers(query: SearchQuery): Promise<{
    brokers: Broker[];
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

    // Get brokers and total count
    const [brokers, total] = await Promise.all([
      prisma.broker.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.broker.count({ where })
    ]);

    return {
      brokers: brokers.map(broker => ({
        ...broker,
        createdAt: broker.createdAt.toISOString(),
        updatedAt: broker.updatedAt.toISOString(),
        deletedAt: broker.deletedAt?.toISOString()
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
   * Get broker by ID
   */
  static async getBrokerById(id: string): Promise<Broker | null> {
    const broker = await prisma.broker.findUnique({
      where: { id, deletedAt: null }
    });

    if (!broker) return null;

    return {
      ...broker,
      createdAt: broker.createdAt.toISOString(),
      updatedAt: broker.updatedAt.toISOString(),
      deletedAt: broker.deletedAt?.toISOString()
    };
  }

  /**
   * Create new broker
   */
  static async createBroker(data: BrokerCreateRequest): Promise<Broker> {
    // Check for duplicate phone or national ID
    if (data.phone || data.nationalId) {
      const existingBroker = await prisma.broker.findFirst({
        where: {
          deletedAt: null,
          OR: [
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.nationalId ? [{ nationalId: data.nationalId }] : [])
          ]
        }
      });

      if (existingBroker) {
        throw new Error('Broker with this phone or national ID already exists');
      }
    }

    const broker = await prisma.broker.create({
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
      ...broker,
      createdAt: broker.createdAt.toISOString(),
      updatedAt: broker.updatedAt.toISOString(),
      deletedAt: broker.deletedAt?.toISOString()
    };
  }

  /**
   * Update broker
   */
  static async updateBroker(id: string, data: BrokerUpdateRequest): Promise<Broker | null> {
    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingBroker) return null;

    // Check for duplicate phone or national ID (excluding current broker)
    if (data.phone || data.nationalId) {
      const duplicateBroker = await prisma.broker.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          OR: [
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.nationalId ? [{ nationalId: data.nationalId }] : [])
          ]
        }
      });

      if (duplicateBroker) {
        throw new Error('Broker with this phone or national ID already exists');
      }
    }

    const broker = await prisma.broker.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    return {
      ...broker,
      createdAt: broker.createdAt.toISOString(),
      updatedAt: broker.updatedAt.toISOString(),
      deletedAt: broker.deletedAt?.toISOString()
    };
  }

  /**
   * Delete broker (soft delete)
   */
  static async deleteBroker(id: string): Promise<boolean> {
    const broker = await prisma.broker.findUnique({
      where: { id, deletedAt: null }
    });

    if (!broker) return false;

    await prisma.broker.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Get broker contracts
   */
  static async getBrokerContracts(brokerId: string): Promise<any[]> {
    const contracts = await prisma.contract.findMany({
      where: {
        brokerName: brokerId,
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
   * Get broker statistics
   */
  static async getBrokerStats(brokerId: string): Promise<{
    totalContracts: number;
    totalValue: number;
    totalCommission: number;
    lastContractDate?: string;
  }> {
    const contracts = await prisma.contract.findMany({
      where: {
        brokerName: brokerId,
        deletedAt: null
      }
    });

    const totalContracts = contracts.length;
    const totalValue = contracts.reduce((sum, contract) => sum + contract.totalPrice, 0);
    const totalCommission = contracts.reduce((sum, contract) => sum + (contract.brokerAmount || 0), 0);
    const lastContractDate = contracts.length > 0 
      ? contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString()
      : undefined;

    return {
      totalContracts,
      totalValue,
      totalCommission,
      lastContractDate
    };
  }

  /**
   * Search brokers
   */
  static async searchBrokers(searchTerm: string): Promise<Broker[]> {
    const brokers = await prisma.broker.findMany({
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

    return brokers.map(broker => ({
      ...broker,
      createdAt: broker.createdAt.toISOString(),
      updatedAt: broker.updatedAt.toISOString(),
      deletedAt: broker.deletedAt?.toISOString()
    }));
  }

  /**
   * Get brokers by status
   */
  static async getBrokersByStatus(status: string): Promise<Broker[]> {
    const brokers = await prisma.broker.findMany({
      where: {
        status,
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });

    return brokers.map(broker => ({
      ...broker,
      createdAt: broker.createdAt.toISOString(),
      updatedAt: broker.updatedAt.toISOString(),
      deletedAt: broker.deletedAt?.toISOString()
    }));
  }
}