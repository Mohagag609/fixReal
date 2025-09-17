import { Router } from 'express';
import { SafeController } from '../controllers/safeController';
import { authenticate } from '../middleware/auth';
import {
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All safe routes require authentication
router.use(authenticate);

// Safe CRUD operations
router.get('/', validatePagination, SafeController.getAllSafes);
router.get('/search', validateSearch, SafeController.getAllSafes);
router.get('/:id', validateId, SafeController.getSafeById);
router.post('/', SafeController.createSafe);
router.put('/:id', validateId, SafeController.updateSafe);
router.delete('/:id', validateId, SafeController.deleteSafe);

// Safe specific operations
router.get('/:id/transactions', validateId, SafeController.getSafeTransactions);
router.get('/:id/stats', validateId, SafeController.getSafeStats);
router.post('/transfer', SafeController.transferMoney);

export default router;