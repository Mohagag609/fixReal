import { Request, Response } from 'express';
import { CalculationService } from '../services/calculationService';
import { ApiResponse, AuthenticatedRequest } from '../types';

export class DashboardController {
  /**
   * Get dashboard statistics
   */
  static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const stats = await CalculationService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get dashboard statistics'
      } as ApiResponse);
    }
  }

  /**
   * Get financial summary
   */
  static async getFinancialSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const summary = await CalculationService.getFinancialSummary();

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Financial summary retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get financial summary'
      } as ApiResponse);
    }
  }

  /**
   * Get safe balances
   */
  static async getSafeBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const balances = await CalculationService.getSafeBalances();

      res.status(200).json({
        success: true,
        data: balances,
        message: 'Safe balances retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get safe balances'
      } as ApiResponse);
    }
  }

  /**
   * Get installment status summary
   */
  static async getInstallmentStatusSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const summary = await CalculationService.getInstallmentStatusSummary();

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Installment status summary retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get installment status summary'
      } as ApiResponse);
    }
  }

  /**
   * Calculate unit profit/loss
   */
  static async calculateUnitProfitLoss(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (!unitId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Unit ID is required'
        } as ApiResponse);
        return;
      }

      const result = await CalculationService.calculateUnitProfitLoss(unitId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Unit profit/loss calculated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to calculate unit profit/loss'
      } as ApiResponse);
    }
  }

  /**
   * Calculate partner share
   */
  static async calculatePartnerShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { partnerId } = req.params;

      if (!partnerId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Partner ID is required'
        } as ApiResponse);
        return;
      }

      const result = await CalculationService.calculatePartnerShare(partnerId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Partner share calculated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to calculate partner share'
      } as ApiResponse);
    }
  }
}