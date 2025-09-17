import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { validateId } from '../middleware/validation';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard statistics
router.get('/stats', DashboardController.getStats);
router.get('/financial-summary', DashboardController.getFinancialSummary);
router.get('/safe-balances', DashboardController.getSafeBalances);
router.get('/installment-status', DashboardController.getInstallmentStatusSummary);

// Calculations
router.get('/unit-profit-loss/:unitId', validateId, DashboardController.calculateUnitProfitLoss);
router.get('/partner-share/:partnerId', validateId, DashboardController.calculatePartnerShare);

export default router;