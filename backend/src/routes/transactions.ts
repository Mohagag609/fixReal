import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';
import {
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// Transaction CRUD operations
router.get('/', validatePagination, TransactionController.getAllTransactions);
router.get('/search', validateSearch, TransactionController.getAllTransactions);
router.get('/stats', TransactionController.getTransactionStats);
router.get('/type/:type', TransactionController.getTransactionsByType);
router.get('/safe/:safeId', TransactionController.getTransactionsBySafe);
router.get('/:id', validateId, TransactionController.getTransactionById);
router.post('/', TransactionController.createTransaction);
router.put('/:id', validateId, TransactionController.updateTransaction);
router.delete('/:id', validateId, TransactionController.deleteTransaction);

export default router;