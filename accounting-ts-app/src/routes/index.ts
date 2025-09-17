import { Router } from 'express';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import propertyRoutes from './property.routes';
import contractRoutes from './contract.routes';
import tenantRoutes from './tenant.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import expenseRoutes from './expense.routes';
import reportRoutes from './report.routes';

const router = Router();

// API routes
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/properties', propertyRoutes);
router.use('/contracts', contractRoutes);
router.use('/tenants', tenantRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);

export default router;