import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class TransactionController {
  /**
   * Get all transactions with pagination and search
   */
  static async getAllTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const query: SearchQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await TransactionService.getAllTransactions(query);

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
        message: 'Transactions retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get transactions'
      } as ApiResponse);
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const transaction = await TransactionService.getTransactionById(id);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Transaction not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get transaction'
      } as ApiResponse);
    }
  }

  /**
   * Create new transaction
   */
  static async createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: errors.array()[0].msg
        } as ApiResponse);
        return;
      }

      const transactionData = req.body;
      const transaction = await TransactionService.createTransaction(transactionData);

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create transaction'
      } as ApiResponse);
    }
  }

  /**
   * Update transaction
   */
  static async updateTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: errors.array()[0].msg
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const updateData = req.body;
      const transaction = await TransactionService.updateTransaction(id, updateData);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Transaction not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update transaction'
      } as ApiResponse);
    }
  }

  /**
   * Delete transaction (soft delete)
   */
  static async deleteTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { id } = req.params;
      const success = await TransactionService.deleteTransaction(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Transaction not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete transaction'
      } as ApiResponse);
    }
  }

  /**
   * Get transactions by type
   */
  static async getTransactionsByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { type } = req.params;
      const transactions = await TransactionService.getTransactionsByType(type);

      res.status(200).json({
        success: true,
        data: transactions,
        message: 'Transactions retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get transactions by type'
      } as ApiResponse);
    }
  }

  /**
   * Get transactions by safe
   */
  static async getTransactionsBySafe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { safeId } = req.params;
      const transactions = await TransactionService.getTransactionsBySafe(safeId);

      res.status(200).json({
        success: true,
        data: transactions,
        message: 'Transactions retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get transactions by safe'
      } as ApiResponse);
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const stats = await TransactionService.getTransactionStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Transaction statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get transaction statistics'
      } as ApiResponse);
    }
  }
}