import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';

const router = Router();
const expenseController = new ExpenseController();

// Expense routes
router.post('/', expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/summary', expenseController.getExpenseSummary);
router.get('/date-range', expenseController.getExpensesByDateRange);
router.get('/category/:category', expenseController.getExpensesByCategory);
router.get('/account/:accountId', expenseController.getExpensesByAccount);
router.get('/property/:propertyId', expenseController.getExpensesByProperty);
router.get('/property/:propertyId/date-range', expenseController.getExpensesByPropertyAndDateRange);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

export default router;