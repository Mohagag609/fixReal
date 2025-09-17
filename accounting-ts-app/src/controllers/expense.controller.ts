import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { CreateExpenseData, UpdateExpenseData } from '../models/expense.model';

const expenseService = new ExpenseService();

export class ExpenseController {
  async createExpense(req: Request, res: Response) {
    try {
      const data: CreateExpenseData = req.body;
      const expense = await expenseService.createExpense(data);
      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: expense,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create expense',
      });
    }
  }

  async getAllExpenses(req: Request, res: Response) {
    try {
      const expenses = await expenseService.getAllExpenses();
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expenses',
      });
    }
  }

  async getExpenseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Expense ID is required',
        });
      }
      const expense = await expenseService.getExpenseById(parseInt(id));
      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Expense not found',
      });
    }
  }

  async updateExpense(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Expense ID is required',
        });
      }
      const data: UpdateExpenseData = req.body;
      const expense = await expenseService.updateExpense(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: expense,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update expense',
      });
    }
  }

  async deleteExpense(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Expense ID is required',
        });
      }
      await expenseService.deleteExpense(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete expense',
      });
    }
  }

  async getExpensesByProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      const expenses = await expenseService.getExpensesByProperty(parseInt(propertyId));
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expenses by property',
      });
    }
  }

  async getExpensesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required',
        });
      }
      const expenses = await expenseService.getExpensesByCategory(category);
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expenses by category',
      });
    }
  }

  async getExpensesByAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required',
        });
      }
      const expenses = await expenseService.getExpensesByAccount(parseInt(accountId));
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expenses by account',
      });
    }
  }

  async getExpenseSummary(req: Request, res: Response) {
    try {
      const summary = await expenseService.getExpenseSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expense summary',
      });
    }
  }

  async getExpensesByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }
      const expenses = await expenseService.getExpensesByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expenses by date range',
      });
    }
  }

  async getExpensesByPropertyAndDateRange(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate } = req.query;
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }
      const expenses = await expenseService.getExpensesByPropertyAndDateRange(
        parseInt(propertyId),
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expenses by property and date range',
      });
    }
  }
}