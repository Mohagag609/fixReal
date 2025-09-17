import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

// Payment routes
router.post('/', paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/summary', paymentController.getPaymentSummary);
router.get('/invoice/:invoiceId', paymentController.getPaymentsByInvoice);
router.get('/contract/:contractId', paymentController.getPaymentsByContract);
router.get('/tenant/:tenantId', paymentController.getPaymentsByTenant);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

export default router;