import { Router } from 'express';
import { ContractController } from '../controllers/contractController';
import { authenticate } from '../middleware/auth';
import {
  validateContract,
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All contract routes require authentication
router.use(authenticate);

// Contract CRUD operations
router.get('/', validatePagination, ContractController.getAllContracts);
router.get('/search', validateSearch, ContractController.getAllContracts);
router.get('/:id', validateId, ContractController.getContractById);
router.post('/', validateContract, ContractController.createContract);
router.put('/:id', validateId, validateContract, ContractController.updateContract);
router.delete('/:id', validateId, ContractController.deleteContract);

// Contract specific operations
router.get('/:id/installments', validateId, ContractController.getContractInstallments);
router.get('/:id/stats', validateId, ContractController.getContractStats);
router.get('/:id/pdf', validateId, ContractController.generateContractPDF);

export default router;