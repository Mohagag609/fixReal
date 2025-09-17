import { Request, Response } from 'express';
import { SafeService } from '../services/safeService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class SafeController {
  /**
   * Get all safes with pagination and search
   */
  static async getAllSafes(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await SafeService.getAllSafes(query);

      res.status(200).json({
        success: true,
        data: result.safes,
        pagination: result.pagination,
        message: 'Safes retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get safes'
      } as ApiResponse);
    }
  }

  /**
   * Get safe by ID
   */
  static async getSafeById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const safe = await SafeService.getSafeById(id);

      if (!safe) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Safe not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: safe,
        message: 'Safe retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get safe'
      } as ApiResponse);
    }
  }

  /**
   * Create new safe
   */
  static async createSafe(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const safeData = req.body;
      const safe = await SafeService.createSafe(safeData);

      res.status(201).json({
        success: true,
        data: safe,
        message: 'Safe created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create safe'
      } as ApiResponse);
    }
  }

  /**
   * Update safe
   */
  static async updateSafe(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const safe = await SafeService.updateSafe(id, updateData);

      if (!safe) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Safe not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: safe,
        message: 'Safe updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update safe'
      } as ApiResponse);
    }
  }

  /**
   * Delete safe (soft delete)
   */
  static async deleteSafe(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await SafeService.deleteSafe(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Safe not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Safe deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete safe'
      } as ApiResponse);
    }
  }

  /**
   * Get safe transactions
   */
  static async getSafeTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const transactions = await SafeService.getSafeTransactions(id);

      res.status(200).json({
        success: true,
        data: transactions,
        message: 'Safe transactions retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get safe transactions'
      } as ApiResponse);
    }
  }

  /**
   * Get safe statistics
   */
  static async getSafeStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const stats = await SafeService.getSafeStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Safe statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get safe statistics'
      } as ApiResponse);
    }
  }

  /**
   * Transfer money between safes
   */
  static async transferMoney(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { fromSafeId, toSafeId, amount, description } = req.body;
      const result = await SafeService.transferMoney(fromSafeId, toSafeId, amount, description);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Money transferred successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to transfer money'
      } as ApiResponse);
    }
  }
}