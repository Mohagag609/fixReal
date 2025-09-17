import prisma from '../config/db';
import { CreateTransactionData, UpdateTransactionData, TransactionSummary } from '../models/transaction.model';

export class TransactionService {
  async createTransaction(data: CreateTransactionData) {
    return prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          type: data.type,
          description: data.description,
          category: data.category || null,
          accountId: data.accountId,
          propertyId: data.propertyId || null,
        },
      });

      // Update account balance
      await this.updateAccountBalance(tx, data.accountId);

      return transaction;
    });
  }

  async getAllTransactions() {
    return prisma.transaction.findMany({
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionById(id: number) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async updateTransaction(id: number, data: UpdateTransactionData) {
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data,
      });

      // Update account balance
      await this.updateAccountBalance(tx, transaction.accountId);

      return updatedTransaction;
    });
  }

  async deleteTransaction(id: number) {
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id } });

      // Update account balance
      await this.updateAccountBalance(tx, transaction.accountId);
    });
  }

  async getTransactionsByAccount(accountId: number) {
    return prisma.transaction.findMany({
      where: { accountId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionsByProperty(propertyId: number) {
    return prisma.transaction.findMany({
      where: { propertyId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionSummary(): Promise<TransactionSummary> {
    const transactions = await prisma.transaction.findMany({
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const totalTransactions = transactions.length;
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalCredits - totalDebits;

    // Group by category
    const transactionsByCategory = transactions.reduce((acc, transaction) => {
      const category = transaction.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    // Group by month
    const transactionsByMonth = transactions.reduce((acc, transaction) => {
      const month = transaction.createdAt.toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, credits: 0, debits: 0, net: 0 };
      }
      if (transaction.type === 'credit') {
        acc[month].credits += transaction.amount;
      } else {
        acc[month].debits += transaction.amount;
      }
      acc[month].net = acc[month].credits - acc[month].debits;
      return acc;
    }, {} as Record<string, { month: string; credits: number; debits: number; net: number }>);

    return {
      totalTransactions,
      totalCredits,
      totalDebits,
      netAmount,
      transactionsByCategory,
      transactionsByMonth: Object.values(transactionsByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  private async updateAccountBalance(tx: any, accountId: number) {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      include: { transactions: true },
    });

    if (!account) return;

    const balance = account.transactions.reduce((acc: number, transaction: any) => {
      return transaction.type === 'credit' ? acc + transaction.amount : acc - transaction.amount;
    }, 0);

    await tx.account.update({
      where: { id: accountId },
      data: { balance },
    });
  }
}