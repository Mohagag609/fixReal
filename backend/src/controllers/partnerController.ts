import { Request, Response } from 'express';
import { PartnerService } from '../services/partnerService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class PartnerController {
  /**
   * Get all partners with pagination and search
   */
  static async getAllPartners(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await PartnerService.getAllPartners(query);

      res.status(200).json({
        success: true,
        data: result.partners,
        pagination: result.pagination,
        message: 'Partners retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get partners'
      } as ApiResponse);
    }
  }

  /**
   * Get partner by ID
   */
  static async getPartnerById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const partner = await PartnerService.getPartnerById(id);

      if (!partner) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Partner not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: partner,
        message: 'Partner retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get partner'
      } as ApiResponse);
    }
  }

  /**
   * Create new partner
   */
  static async createPartner(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const partnerData = req.body;
      const partner = await PartnerService.createPartner(partnerData);

      res.status(201).json({
        success: true,
        data: partner,
        message: 'Partner created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create partner'
      } as ApiResponse);
    }
  }

  /**
   * Update partner
   */
  static async updatePartner(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const partner = await PartnerService.updatePartner(id, updateData);

      if (!partner) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Partner not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: partner,
        message: 'Partner updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update partner'
      } as ApiResponse);
    }
  }

  /**
   * Delete partner (soft delete)
   */
  static async deletePartner(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await PartnerService.deletePartner(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Partner not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Partner deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete partner'
      } as ApiResponse);
    }
  }

  /**
   * Get partner units
   */
  static async getPartnerUnits(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const units = await PartnerService.getPartnerUnits(id);

      res.status(200).json({
        success: true,
        data: units,
        message: 'Partner units retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get partner units'
      } as ApiResponse);
    }
  }

  /**
   * Get partner statistics
   */
  static async getPartnerStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const stats = await PartnerService.getPartnerStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Partner statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get partner statistics'
      } as ApiResponse);
    }
  }
}