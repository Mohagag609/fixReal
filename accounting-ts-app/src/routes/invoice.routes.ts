import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';

const router = Router();
const invoiceController = new InvoiceController();

// Invoice routes
router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getAllInvoices);
router.get('/generate-number', invoiceController.generateInvoiceNumber);
router.get('/overdue', invoiceController.getOverdueInvoices);
router.get('/summary', invoiceController.getInvoiceSummary);
router.get('/status/:status', invoiceController.getInvoicesByStatus);
router.get('/property/:propertyId', invoiceController.getInvoicesByProperty);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', invoiceController.updateInvoice);
router.put('/:id/mark-paid', invoiceController.markInvoiceAsPaid);
router.put('/:id/mark-overdue', invoiceController.markInvoiceAsOverdue);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;