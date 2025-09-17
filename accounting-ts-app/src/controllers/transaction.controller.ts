import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionData, UpdateTransactionData } from '../models/transaction.model';

const transactionService = new TransactionService();

export class TransactionController {
  async createTransaction(req: Request, res: Response) {
    try {
      const data: CreateTransactionData = req.body;
      const transaction = await transactionService.createTransaction(data);
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create transaction',
      });
    }
  }

  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await transactionService.getAllTransactions();
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch transactions',
      });
    }
  }

  async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required',
        });
      }
      const transaction = await transactionService.getTransactionById(parseInt(id));
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Transaction not found',
      });
    }
  }

  async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required',
        });
      }
      const data: UpdateTransactionData = req.body;
      const transaction = await transactionService.updateTransaction(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update transaction',
      });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required',
        });
      }
      await transactionService.deleteTransaction(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete transaction',
      });
    }
  }

  async getTransactionsByAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required',
        });
      }
      const transactions = await transactionService.getTransactionsByAccount(parseInt(accountId));
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch transactions by account',
      });
    }
  }

  async getTransactionsByProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      const transactions = await transactionService.getTransactionsByProperty(parseInt(propertyId));
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch transactions by property',
      });
    }
  }

  async getTransactionSummary(req: Request, res: Response) {
    try {
      const summary = await transactionService.getTransactionSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch transaction summary',
      });
    }
  }
}