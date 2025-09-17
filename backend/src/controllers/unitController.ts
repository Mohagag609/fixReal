import { Request, Response } from 'express';
import { UnitService } from '../services/unitService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class UnitController {
  /**
   * Get all units with pagination and search
   */
  static async getAllUnits(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await UnitService.getAllUnits(query);

      res.status(200).json({
        success: true,
        data: result.units,
        pagination: result.pagination,
        message: 'Units retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get units'
      } as ApiResponse);
    }
  }

  /**
   * Get unit by ID
   */
  static async getUnitById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const unit = await UnitService.getUnitById(id);

      if (!unit) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Unit not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: unit,
        message: 'Unit retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get unit'
      } as ApiResponse);
    }
  }

  /**
   * Create new unit
   */
  static async createUnit(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const unitData = req.body;
      const unit = await UnitService.createUnit(unitData);

      res.status(201).json({
        success: true,
        data: unit,
        message: 'Unit created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create unit'
      } as ApiResponse);
    }
  }

  /**
   * Update unit
   */
  static async updateUnit(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const unit = await UnitService.updateUnit(id, updateData);

      if (!unit) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Unit not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: unit,
        message: 'Unit updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update unit'
      } as ApiResponse);
    }
  }

  /**
   * Delete unit (soft delete)
   */
  static async deleteUnit(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await UnitService.deleteUnit(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Unit not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Unit deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete unit'
      } as ApiResponse);
    }
  }

  /**
   * Get unit contracts
   */
  static async getUnitContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const contracts = await UnitService.getUnitContracts(id);

      res.status(200).json({
        success: true,
        data: contracts,
        message: 'Unit contracts retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get unit contracts'
      } as ApiResponse);
    }
  }

  /**
   * Get unit statistics
   */
  static async getUnitStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const stats = await UnitService.getUnitStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Unit statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get unit statistics'
      } as ApiResponse);
    }
  }

  /**
   * Get units by type
   */
  static async getUnitsByType(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const units = await UnitService.getUnitsByType(type);

      res.status(200).json({
        success: true,
        data: units,
        message: 'Units retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get units by type'
      } as ApiResponse);
    }
  }
}