import { Router } from 'express';
import { InstallmentController } from '../controllers/installmentController';
import { authenticate } from '../middleware/auth';
import {
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All installment routes require authentication
router.use(authenticate);

// Installment CRUD operations
router.get('/', validatePagination, InstallmentController.getAllInstallments);
router.get('/search', validateSearch, InstallmentController.getAllInstallments);
router.get('/overdue', InstallmentController.getOverdueInstallments);
router.get('/status/:status', InstallmentController.getInstallmentsByStatus);
router.get('/unit/:unitId', InstallmentController.getInstallmentsByUnit);
router.get('/:id', validateId, InstallmentController.getInstallmentById);
router.post('/', InstallmentController.createInstallment);
router.put('/:id', validateId, InstallmentController.updateInstallment);
router.put('/:id/paid', validateId, InstallmentController.markAsPaid);
router.delete('/:id', validateId, InstallmentController.deleteInstallment);

export default router;