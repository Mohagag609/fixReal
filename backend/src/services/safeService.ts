import prisma from '../config/database';
import { Safe, SafeCreateRequest, SafeUpdateRequest, SearchQuery } from '../types';

export class SafeService {
  /**
   * Get all safes with pagination and search
   */
  static async getAllSafes(query: SearchQuery): Promise<{
    safes: Safe[];
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
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get safes and total count
    const [safes, total] = await Promise.all([
      prisma.safe.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.safe.count({ where })
    ]);

    return {
      safes: safes.map(safe => ({
        ...safe,
        createdAt: safe.createdAt.toISOString(),
        updatedAt: safe.updatedAt.toISOString(),
        deletedAt: safe.deletedAt?.toISOString()
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
   * Get safe by ID
   */
  static async getSafeById(id: string): Promise<Safe | null> {
    const safe = await prisma.safe.findUnique({
      where: { id, deletedAt: null }
    });

    if (!safe) return null;

    return {
      ...safe,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      deletedAt: safe.deletedAt?.toISOString()
    };
  }

  /**
   * Create new safe
   */
  static async createSafe(data: SafeCreateRequest): Promise<Safe> {
    const safe = await prisma.safe.create({
      data: {
        name: data.name,
        description: data.description,
        balance: data.balance || 0,
        status: data.status || 'نشط'
      }
    });

    return {
      ...safe,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      deletedAt: safe.deletedAt?.toISOString()
    };
  }

  /**
   * Update safe
   */
  static async updateSafe(id: string, data: SafeUpdateRequest): Promise<Safe | null> {
    // Check if safe exists
    const existingSafe = await prisma.safe.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingSafe) return null;

    const safe = await prisma.safe.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.balance !== undefined && { balance: data.balance }),
        ...(data.status && { status: data.status })
      }
    });

    return {
      ...safe,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      deletedAt: safe.deletedAt?.toISOString()
    };
  }

  /**
   * Delete safe (soft delete)
   */
  static async deleteSafe(id: string): Promise<boolean> {
    const safe = await prisma.safe.findUnique({
      where: { id, deletedAt: null }
    });

    if (!safe) return false;

    await prisma.safe.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Get safe transactions
   */
  static async getSafeTransactions(safeId: string): Promise<any[]> {
    const transactions = await prisma.voucher.findMany({
      where: {
        safeId,
        deletedAt: null
      },
      orderBy: { date: 'desc' }
    });

    return transactions.map(transaction => ({
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      deletedAt: transaction.deletedAt?.toISOString()
    }));
  }

  /**
   * Get safe statistics
   */
  static async getSafeStats(safeId: string): Promise<{
    totalReceipts: number;
    totalPayments: number;
    netAmount: number;
    transactionCount: number;
    lastTransactionDate?: string;
  }> {
    const [transactions, lastTransaction] = await Promise.all([
      prisma.voucher.findMany({
        where: { safeId, deletedAt: null }
      }),
      prisma.voucher.findFirst({
        where: { safeId, deletedAt: null },
        orderBy: { date: 'desc' }
      })
    ]);

    const totalReceipts = transactions
      .filter(t => t.type === 'receipt')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPayments = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalReceipts - totalPayments;
    const transactionCount = transactions.length;
    const lastTransactionDate = lastTransaction?.date.toISOString();

    return {
      totalReceipts,
      totalPayments,
      netAmount,
      transactionCount,
      lastTransactionDate
    };
  }

  /**
   * Transfer money between safes
   */
  static async transferMoney(fromSafeId: string, toSafeId: string, amount: number, description?: string): Promise<{
    fromSafe: Safe;
    toSafe: Safe;
    transaction: any;
  }> {
    // Validate safes exist
    const [fromSafe, toSafe] = await Promise.all([
      prisma.safe.findUnique({ where: { id: fromSafeId, deletedAt: null } }),
      prisma.safe.findUnique({ where: { id: toSafeId, deletedAt: null } })
    ]);

    if (!fromSafe || !toSafe) {
      throw new Error('One or both safes not found');
    }

    if (fromSafe.balance < amount) {
      throw new Error('Insufficient balance in source safe');
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update balances
      const updatedFromSafe = await tx.safe.update({
        where: { id: fromSafeId },
        data: { balance: fromSafe.balance - amount }
      });

      const updatedToSafe = await tx.safe.update({
        where: { id: toSafeId },
        data: { balance: toSafe.balance + amount }
      });

      // Create transfer transaction
      const transaction = await tx.voucher.create({
        data: {
          type: 'transfer',
          date: new Date(),
          amount,
          safeId: fromSafeId,
          description: description || `Transfer from ${fromSafe.name} to ${toSafe.name}`,
          payer: fromSafe.name,
          beneficiary: toSafe.name
        }
      });

      return {
        fromSafe: updatedFromSafe,
        toSafe: updatedToSafe,
        transaction
      };
    });

    return {
      fromSafe: {
        ...result.fromSafe,
        createdAt: result.fromSafe.createdAt.toISOString(),
        updatedAt: result.fromSafe.updatedAt.toISOString(),
        deletedAt: result.fromSafe.deletedAt?.toISOString()
      },
      toSafe: {
        ...result.toSafe,
        createdAt: result.toSafe.createdAt.toISOString(),
        updatedAt: result.toSafe.updatedAt.toISOString(),
        deletedAt: result.toSafe.deletedAt?.toISOString()
      },
      transaction: {
        ...result.transaction,
        date: result.transaction.date.toISOString(),
        createdAt: result.transaction.createdAt.toISOString(),
        updatedAt: result.transaction.updatedAt.toISOString(),
        deletedAt: result.transaction.deletedAt?.toISOString()
      }
    };
  }

  /**
   * Search safes
   */
  static async searchSafes(searchTerm: string): Promise<Safe[]> {
    const safes = await prisma.safe.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    return safes.map(safe => ({
      ...safe,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      deletedAt: safe.deletedAt?.toISOString()
    }));
  }

  /**
   * Get safes by status
   */
  static async getSafesByStatus(status: string): Promise<Safe[]> {
    const safes = await prisma.safe.findMany({
      where: {
        status,
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });

    return safes.map(safe => ({
      ...safe,
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      deletedAt: safe.deletedAt?.toISOString()
    }));
  }

  /**
   * Get total balance across all safes
   */
  static async getTotalBalance(): Promise<number> {
    const result = await prisma.safe.aggregate({
      where: { deletedAt: null },
      _sum: { balance: true }
    });

    return result._sum.balance || 0;
  }
}