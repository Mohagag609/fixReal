import { Request, Response } from 'express';
import { InstallmentService } from '../services/installmentService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class InstallmentController {
  /**
   * Get all installments with pagination and search
   */
  static async getAllInstallments(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        sortBy: req.query.sortBy as string || 'dueDate',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc'
      };

      const result = await InstallmentService.getAllInstallments(query);

      res.status(200).json({
        success: true,
        data: result.installments,
        pagination: result.pagination,
        message: 'Installments retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get installments'
      } as ApiResponse);
    }
  }

  /**
   * Get installment by ID
   */
  static async getInstallmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const installment = await InstallmentService.getInstallmentById(id);

      if (!installment) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Installment not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: installment,
        message: 'Installment retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get installment'
      } as ApiResponse);
    }
  }

  /**
   * Create new installment
   */
  static async createInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const installmentData = req.body;
      const installment = await InstallmentService.createInstallment(installmentData);

      res.status(201).json({
        success: true,
        data: installment,
        message: 'Installment created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create installment'
      } as ApiResponse);
    }
  }

  /**
   * Update installment
   */
  static async updateInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const installment = await InstallmentService.updateInstallment(id, updateData);

      if (!installment) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Installment not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: installment,
        message: 'Installment updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update installment'
      } as ApiResponse);
    }
  }

  /**
   * Delete installment (soft delete)
   */
  static async deleteInstallment(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await InstallmentService.deleteInstallment(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Installment not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Installment deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete installment'
      } as ApiResponse);
    }
  }

  /**
   * Mark installment as paid
   */
  static async markAsPaid(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { paymentDate, notes } = req.body;
      const installment = await InstallmentService.markAsPaid(id, paymentDate, notes);

      if (!installment) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Installment not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: installment,
        message: 'Installment marked as paid successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to mark installment as paid'
      } as ApiResponse);
    }
  }

  /**
   * Get overdue installments
   */
  static async getOverdueInstallments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const installments = await InstallmentService.getOverdueInstallments();

      res.status(200).json({
        success: true,
        data: installments,
        message: 'Overdue installments retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get overdue installments'
      } as ApiResponse);
    }
  }

  /**
   * Get installments by status
   */
  static async getInstallmentsByStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { status } = req.params;
      const installments = await InstallmentService.getInstallmentsByStatus(status);

      res.status(200).json({
        success: true,
        data: installments,
        message: 'Installments retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get installments by status'
      } as ApiResponse);
    }
  }

  /**
   * Get installments by unit
   */
  static async getInstallmentsByUnit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { unitId } = req.params;
      const installments = await InstallmentService.getInstallmentsByUnit(unitId);

      res.status(200).json({
        success: true,
        data: installments,
        message: 'Installments retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get installments by unit'
      } as ApiResponse);
    }
  }
}