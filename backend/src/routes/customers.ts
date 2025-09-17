import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middleware/auth';
import {
  validateCustomer,
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Customer CRUD operations
router.get('/', validatePagination, CustomerController.getAllCustomers);
router.get('/search', validateSearch, CustomerController.getAllCustomers);
router.get('/:id', validateId, CustomerController.getCustomerById);
router.post('/', validateCustomer, CustomerController.createCustomer);
router.put('/:id', validateId, validateCustomer, CustomerController.updateCustomer);
router.delete('/:id', validateId, CustomerController.deleteCustomer);

// Customer specific operations
router.get('/:id/contracts', validateId, CustomerController.getCustomerContracts);
router.get('/:id/stats', validateId, CustomerController.getCustomerStats);

export default router;