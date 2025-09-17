import { Request, Response } from 'express';
import { ContractService } from '../services/contractService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class ContractController {
  /**
   * Get all contracts with pagination and search
   */
  static async getAllContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await ContractService.getAllContracts(query);

      res.status(200).json({
        success: true,
        data: result.contracts,
        pagination: result.pagination,
        message: 'Contracts retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get contracts'
      } as ApiResponse);
    }
  }

  /**
   * Get contract by ID
   */
  static async getContractById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const contract = await ContractService.getContractById(id);

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Contract not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: contract,
        message: 'Contract retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get contract'
      } as ApiResponse);
    }
  }

  /**
   * Create new contract
   */
  static async createContract(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const contractData = req.body;
      const contract = await ContractService.createContract(contractData);

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Contract created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create contract'
      } as ApiResponse);
    }
  }

  /**
   * Update contract
   */
  static async updateContract(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const contract = await ContractService.updateContract(id, updateData);

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Contract not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: contract,
        message: 'Contract updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update contract'
      } as ApiResponse);
    }
  }

  /**
   * Delete contract (soft delete)
   */
  static async deleteContract(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await ContractService.deleteContract(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Contract not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Contract deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete contract'
      } as ApiResponse);
    }
  }

  /**
   * Get contract installments
   */
  static async getContractInstallments(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const installments = await ContractService.getContractInstallments(id);

      res.status(200).json({
        success: true,
        data: installments,
        message: 'Contract installments retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get contract installments'
      } as ApiResponse);
    }
  }

  /**
   * Get contract statistics
   */
  static async getContractStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const stats = await ContractService.getContractStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Contract statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get contract statistics'
      } as ApiResponse);
    }
  }

  /**
   * Generate contract PDF
   */
  static async generateContractPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const pdfBuffer = await ContractService.generateContractPDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contract-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to generate contract PDF'
      } as ApiResponse);
    }
  }
}