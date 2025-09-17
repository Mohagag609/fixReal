import prisma from '../config/db';
import { CreateExpenseData, UpdateExpenseData, ExpenseSummary } from '../models/expense.model';

export class ExpenseService {
  async createExpense(data: CreateExpenseData) {
    return prisma.$transaction(async (tx) => {
      // Create the expense
      const expense = await tx.expense.create({
        data: {
          amount: data.amount,
          category: data.category,
          description: data.description,
          propertyId: data.propertyId || null,
          accountId: data.accountId,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          amount: data.amount,
          type: 'debit',
          description: data.description,
          category: data.category,
          accountId: data.accountId,
          propertyId: data.propertyId || null,
        },
      });

      return expense;
    });
  }

  async getAllExpenses() {
    return prisma.expense.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpenseById(id: number) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return expense;
  }

  async updateExpense(id: number, data: UpdateExpenseData) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new Error('Expense not found');
    }

    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async deleteExpense(id: number) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new Error('Expense not found');
    }

    return prisma.expense.delete({ where: { id } });
  }

  async getExpensesByProperty(propertyId: number) {
    return prisma.expense.findMany({
      where: { propertyId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpensesByCategory(category: string) {
    return prisma.expense.findMany({
      where: { category },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpensesByAccount(accountId: number) {
    return prisma.expense.findMany({
      where: { accountId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpenseSummary(): Promise<ExpenseSummary> {
    const expenses = await prisma.expense.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    });

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Group by property
    const expensesByProperty = expenses.reduce((acc, expense) => {
      const propertyId = expense.propertyId || 0;
      const propertyTitle = expense.property?.title || 'No Property';
      
      if (!acc[propertyId]) {
        acc[propertyId] = {
          propertyId,
          propertyTitle,
          totalAmount: 0,
          count: 0,
        };
      }
      
      acc[propertyId].totalAmount += expense.amount;
      acc[propertyId].count += 1;
      return acc;
    }, {} as Record<number, { propertyId: number; propertyTitle: string; totalAmount: number; count: number }>);

    // Group by month
    const expensesByMonth = expenses.reduce((acc, expense) => {
      const month = expense.createdAt.toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, amount: 0, count: 0 };
      }
      acc[month].amount += expense.amount;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string; amount: number; count: number }>);

    return {
      totalExpenses,
      totalAmount,
      expensesByCategory,
      expensesByProperty: Object.values(expensesByProperty),
      expensesByMonth: Object.values(expensesByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date) {
    return prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpensesByPropertyAndDateRange(propertyId: number, startDate: Date, endDate: Date) {
    return prisma.expense.findMany({
      where: {
        propertyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}