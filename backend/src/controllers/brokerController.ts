import { Request, Response } from 'express';
import { BrokerService } from '../services/brokerService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class BrokerController {
  /**
   * Get all brokers with pagination and search
   */
  static async getAllBrokers(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await BrokerService.getAllBrokers(query);

      res.status(200).json({
        success: true,
        data: result.brokers,
        pagination: result.pagination,
        message: 'Brokers retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get brokers'
      } as ApiResponse);
    }
  }

  /**
   * Get broker by ID
   */
  static async getBrokerById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const broker = await BrokerService.getBrokerById(id);

      if (!broker) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Broker not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: broker,
        message: 'Broker retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get broker'
      } as ApiResponse);
    }
  }

  /**
   * Create new broker
   */
  static async createBroker(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const brokerData = req.body;
      const broker = await BrokerService.createBroker(brokerData);

      res.status(201).json({
        success: true,
        data: broker,
        message: 'Broker created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create broker'
      } as ApiResponse);
    }
  }

  /**
   * Update broker
   */
  static async updateBroker(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const broker = await BrokerService.updateBroker(id, updateData);

      if (!broker) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Broker not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: broker,
        message: 'Broker updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update broker'
      } as ApiResponse);
    }
  }

  /**
   * Delete broker (soft delete)
   */
  static async deleteBroker(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await BrokerService.deleteBroker(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Broker not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Broker deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete broker'
      } as ApiResponse);
    }
  }

  /**
   * Get broker contracts
   */
  static async getBrokerContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const contracts = await BrokerService.getBrokerContracts(id);

      res.status(200).json({
        success: true,
        data: contracts,
        message: 'Broker contracts retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get broker contracts'
      } as ApiResponse);
    }
  }

  /**
   * Get broker statistics
   */
  static async getBrokerStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const stats = await BrokerService.getBrokerStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Broker statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get broker statistics'
      } as ApiResponse);
    }
  }
}