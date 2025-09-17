import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();
const reportController = new ReportController();

// Report routes
router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/type/:type', reportController.getReportsByType);
router.get('/financial', reportController.generateFinancialReport);
router.get('/property', reportController.generatePropertyReport);
router.get('/tenant', reportController.generateTenantReport);
router.get('/revenue', reportController.generateRevenueReport);
router.get('/:id', reportController.getReportById);
router.delete('/:id', reportController.deleteReport);

export default router;