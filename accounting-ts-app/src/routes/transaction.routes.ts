import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const transactionController = new TransactionController();

// Transaction routes
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getAllTransactions);
router.get('/summary', transactionController.getTransactionSummary);
router.get('/account/:accountId', transactionController.getTransactionsByAccount);
router.get('/property/:propertyId', transactionController.getTransactionsByProperty);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;