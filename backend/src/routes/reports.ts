import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Report endpoints
router.get('/dashboard', ReportController.getDashboardStats);
router.get('/financial', ReportController.getFinancialSummary);
router.get('/sales', ReportController.getSalesReport);
router.get('/customer', ReportController.getCustomerReport);
router.get('/unit', ReportController.getUnitReport);
router.get('/installment', ReportController.getInstallmentReport);
router.get('/safe', ReportController.getSafeReport);

// Export endpoints
router.get('/export/pdf', ReportController.exportReportPDF);
router.get('/export/excel', ReportController.exportReportExcel);

export default router;