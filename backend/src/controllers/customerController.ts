import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { ApiResponse, AuthenticatedRequest, SearchQuery } from '../types';
import { validationResult } from 'express-validator';

export class CustomerController {
  /**
   * Get all customers with pagination and search
   */
  static async getAllCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await CustomerService.getAllCustomers(query);

      res.status(200).json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
        message: 'Customers retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get customers'
      } as ApiResponse);
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const customer = await CustomerService.getCustomerById(id);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Customer not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Customer retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get customer'
      } as ApiResponse);
    }
  }

  /**
   * Create new customer
   */
  static async createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const customerData = req.body;
      const customer = await CustomerService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to create customer'
      } as ApiResponse);
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const customer = await CustomerService.updateCustomer(id, updateData);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Customer not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update customer'
      } as ApiResponse);
    }
  }

  /**
   * Delete customer (soft delete)
   */
  static async deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const success = await CustomerService.deleteCustomer(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Customer not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete customer'
      } as ApiResponse);
    }
  }

  /**
   * Get customer contracts
   */
  static async getCustomerContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const contracts = await CustomerService.getCustomerContracts(id);

      res.status(200).json({
        success: true,
        data: contracts,
        message: 'Customer contracts retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get customer contracts'
      } as ApiResponse);
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const stats = await CustomerService.getCustomerStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Customer statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get customer statistics'
      } as ApiResponse);
    }
  }
}