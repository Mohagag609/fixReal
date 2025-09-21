import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateUpdateProfile,
  validateUpdateUser,
  validateId
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/login', validateLogin, AuthController.login);
router.post('/register', validateRegister, AuthController.register);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validateUpdateProfile, AuthController.updateProfile);
router.put('/change-password', authenticate, validateChangePassword, AuthController.changePassword);

// Admin routes
router.get('/users', authenticate, requireAdmin, AuthController.getAllUsers);
router.put('/users/:id', authenticate, requireAdmin, validateId, validateUpdateUser, AuthController.updateUser);
router.delete('/users/:id', authenticate, requireAdmin, validateId, AuthController.deleteUser);

export default router;