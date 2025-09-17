import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';

const router = Router();
const contractController = new ContractController();

// Contract routes
router.post('/', contractController.createContract);
router.get('/', contractController.getAllContracts);
router.get('/active', contractController.getActiveContracts);
router.get('/expired', contractController.getExpiredContracts);
router.get('/summary', contractController.getContractSummary);
router.get('/property/:propertyId', contractController.getContractsByProperty);
router.get('/tenant/:tenantId', contractController.getContractsByTenant);
router.get('/:id', contractController.getContractById);
router.put('/:id', contractController.updateContract);
router.put('/:id/renew', contractController.renewContract);
router.put('/:id/terminate', contractController.terminateContract);
router.delete('/:id', contractController.deleteContract);

export default router;