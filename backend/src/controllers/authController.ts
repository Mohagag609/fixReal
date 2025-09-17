import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { validationResult } from 'express-validator';

export class AuthController {
  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: errors.array()[0].msg
        } as ApiResponse);
        return;
      }

      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      } as ApiResponse);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        message: 'Invalid credentials'
      } as ApiResponse);
    }
  }

  /**
   * Register new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: errors.array()[0].msg
        } as ApiResponse);
        return;
      }

      const { username, password, email, name, role } = req.body;
      const result = await AuthService.register({
        username,
        password,
        email,
        name,
        role
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        message: 'Failed to register user'
      } as ApiResponse);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: req.user,
        message: 'Profile retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get profile'
      } as ApiResponse);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { email, name } = req.body;
      const updatedUser = await AuthService.updateUser(req.user.id, {
        email,
        name
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update profile'
      } as ApiResponse);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change password',
        message: 'Failed to change password'
      } as ApiResponse);
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required'
        } as ApiResponse);
        return;
      }

      const users = await AuthService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get users'
      } as ApiResponse);
    }
  }

  /**
   * Update user (admin only)
   */
  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required'
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
      const { username, email, name, role, isActive } = req.body;

      const updatedUser = await AuthService.updateUser(id, {
        username,
        email,
        name,
        role,
        isActive
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to update user'
      } as ApiResponse);
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required'
        } as ApiResponse);
        return;
      }

      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.id) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Cannot delete your own account'
        } as ApiResponse);
        return;
      }

      await AuthService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to delete user'
      } as ApiResponse);
    }
  }
}