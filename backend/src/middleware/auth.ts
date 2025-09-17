import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../types';

/**
 * Authentication middleware
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.id);

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or inactive user'
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Admin authorization middleware
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User not authenticated'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required'
    });
    return;
  }

  next();
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.id);

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we continue without user
    }

    next();
  } catch (error) {
    next();
  }
};