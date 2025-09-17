import prisma from '../config/db';
import { CreateAccountData, UpdateAccountData, AccountWithBalance, AccountSummary } from '../models/account.model';

export class AccountService {
  async createAccount(data: CreateAccountData) {
    return prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description || null,
        balance: data.balance || 0,
      },
    });
  }

  async getAllAccounts() {
    return prisma.account.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccountById(id: number) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async updateAccount(id: number, data: UpdateAccountData) {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new Error('Account not found');
    }

    return prisma.account.update({
      where: { id },
      data,
    });
  }

  async deleteAccount(id: number) {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new Error('Account not found');
    }

    return prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAccountBalance(accountId: number): Promise<AccountWithBalance> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { transactions: true },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const balance = account.transactions.reduce((acc, transaction) => {
      return transaction.type === 'credit' ? acc + transaction.amount : acc - transaction.amount;
    }, 0);

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balance,
      description: account.description || undefined,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async getAccountSummary(): Promise<AccountSummary> {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { transactions: true },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      const balance = account.transactions.reduce((acc, transaction) => {
        return transaction.type === 'credit' ? acc + transaction.amount : acc - transaction.amount;
      }, 0);

      switch (account.type) {
        case 'asset':
          totalAssets += balance;
          break;
        case 'liability':
          totalLiabilities += balance;
          break;
        case 'equity':
          totalEquity += balance;
          break;
        case 'revenue':
          totalRevenue += balance;
          break;
        case 'expense':
          totalExpenses += balance;
          break;
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netWorth,
    };
  }

  async getAccountsByType(type: string) {
    return prisma.account.findMany({
      where: { type, isActive: true },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}