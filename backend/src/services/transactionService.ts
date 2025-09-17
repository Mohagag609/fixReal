import prisma from '../config/database';
import { Transaction, TransactionCreateRequest, TransactionUpdateRequest, SearchQuery } from '../types';

export class TransactionService {
  /**
   * Get all transactions with pagination and search
   */
  static async getAllTransactions(query: SearchQuery): Promise<{
    transactions: Transaction[];
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
        { description: { contains: search, mode: 'insensitive' } },
        { payer: { contains: search, mode: 'insensitive' } },
        { beneficiary: { contains: search, mode: 'insensitive' } },
        { safe: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.type = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get transactions and total count
    const [transactions, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          safe: true,
          unit: true
        }
      }),
      prisma.voucher.count({ where })
    ]);

    return {
      transactions: transactions.map(transaction => ({
        ...transaction,
        date: transaction.date.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        deletedAt: transaction.deletedAt?.toISOString()
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
   * Get transaction by ID
   */
  static async getTransactionById(id: string): Promise<Transaction | null> {
    const transaction = await prisma.voucher.findUnique({
      where: { id, deletedAt: null },
      include: {
        safe: true,
        unit: true
      }
    });

    if (!transaction) return null;

    return {
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      deletedAt: transaction.deletedAt?.toISOString()
    };
  }

  /**
   * Create new transaction
   */
  static async createTransaction(data: TransactionCreateRequest): Promise<Transaction> {
    // Validate safe exists
    const safe = await prisma.safe.findUnique({
      where: { id: data.safeId, deletedAt: null }
    });

    if (!safe) {
      throw new Error('Safe not found');
    }

    // Create transaction
    const transaction = await prisma.voucher.create({
      data: {
        type: data.type,
        date: new Date(data.date),
        amount: data.amount,
        safeId: data.safeId,
        description: data.description,
        payer: data.payer,
        beneficiary: data.beneficiary,
        linkedRef: data.linkedRef
      },
      include: {
        safe: true,
        unit: true
      }
    });

    // Update safe balance
    const balanceChange = data.type === 'receipt' ? data.amount : -data.amount;
    await prisma.safe.update({
      where: { id: data.safeId },
      data: { balance: safe.balance + balanceChange }
    });

    return {
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      deletedAt: transaction.deletedAt?.toISOString()
    };
  }

  /**
   * Update transaction
   */
  static async updateTransaction(id: string, data: TransactionUpdateRequest): Promise<Transaction | null> {
    // Check if transaction exists
    const existingTransaction = await prisma.voucher.findUnique({
      where: { id, deletedAt: null },
      include: { safe: true }
    });

    if (!existingTransaction) return null;

    // Calculate balance change
    const oldBalanceChange = existingTransaction.type === 'receipt' 
      ? existingTransaction.amount 
      : -existingTransaction.amount;
    
    const newBalanceChange = data.type === 'receipt' 
      ? (data.amount || existingTransaction.amount)
      : -(data.amount || existingTransaction.amount);

    const balanceDifference = newBalanceChange - oldBalanceChange;

    // Update transaction
    const transaction = await prisma.voucher.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.safeId && { safeId: data.safeId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.payer !== undefined && { payer: data.payer }),
        ...(data.beneficiary !== undefined && { beneficiary: data.beneficiary }),
        ...(data.linkedRef !== undefined && { linkedRef: data.linkedRef })
      },
      include: {
        safe: true,
        unit: true
      }
    });

    // Update safe balance
    await prisma.safe.update({
      where: { id: existingTransaction.safeId },
      data: { balance: existingTransaction.safe.balance + balanceDifference }
    });

    return {
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      deletedAt: transaction.deletedAt?.toISOString()
    };
  }

  /**
   * Delete transaction (soft delete)
   */
  static async deleteTransaction(id: string): Promise<boolean> {
    const transaction = await prisma.voucher.findUnique({
      where: { id, deletedAt: null },
      include: { safe: true }
    });

    if (!transaction) return false;

    // Update safe balance (reverse the transaction)
    const balanceChange = transaction.type === 'receipt' 
      ? -transaction.amount 
      : transaction.amount;

    await prisma.safe.update({
      where: { id: transaction.safeId },
      data: { balance: transaction.safe.balance + balanceChange }
    });

    // Soft delete transaction
    await prisma.voucher.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Get transactions by type
   */
  static async getTransactionsByType(type: string): Promise<Transaction[]> {
    const transactions = await prisma.voucher.findMany({
      where: {
        type,
        deletedAt: null
      },
      include: {
        safe: true,
        unit: true
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
   * Get transactions by safe
   */
  static async getTransactionsBySafe(safeId: string): Promise<Transaction[]> {
    const transactions = await prisma.voucher.findMany({
      where: {
        safeId,
        deletedAt: null
      },
      include: {
        safe: true,
        unit: true
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
   * Get transaction statistics
   */
  static async getTransactionStats(): Promise<{
    totalReceipts: number;
    totalPayments: number;
    netAmount: number;
    totalTransactions: number;
    receiptsCount: number;
    paymentsCount: number;
  }> {
    const [receipts, payments, totalCount] = await Promise.all([
      prisma.voucher.aggregate({
        where: { 
          type: 'receipt',
          deletedAt: null
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.voucher.aggregate({
        where: { 
          type: 'payment',
          deletedAt: null
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.voucher.count({
        where: { deletedAt: null }
      })
    ]);

    const totalReceipts = receipts._sum.amount || 0;
    const totalPayments = payments._sum.amount || 0;
    const netAmount = totalReceipts - totalPayments;

    return {
      totalReceipts,
      totalPayments,
      netAmount,
      totalTransactions: totalCount,
      receiptsCount: receipts._count,
      paymentsCount: payments._count
    };
  }

  /**
   * Search transactions
   */
  static async searchTransactions(searchTerm: string): Promise<Transaction[]> {
    const transactions = await prisma.voucher.findMany({
      where: {
        deletedAt: null,
        OR: [
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { payer: { contains: searchTerm, mode: 'insensitive' } },
          { beneficiary: { contains: searchTerm, mode: 'insensitive' } },
          { safe: { name: { contains: searchTerm, mode: 'insensitive' } } }
        ]
      },
      include: {
        safe: true,
        unit: true
      },
      take: 10,
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
   * Get transactions by date range
   */
  static async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const transactions = await prisma.voucher.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        safe: true,
        unit: true
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
}