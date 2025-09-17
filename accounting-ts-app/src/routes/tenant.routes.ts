import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';

const router = Router();
const tenantController = new TenantController();

// Tenant routes
router.post('/', tenantController.createTenant);
router.get('/', tenantController.getAllTenants);
router.get('/active', tenantController.getActiveTenants);
router.get('/search', tenantController.searchTenants);
router.get('/summary', tenantController.getTenantSummary);
router.get('/:id', tenantController.getTenantById);
router.get('/:id/rent-history', tenantController.getTenantRentHistory);
router.get('/:id/contracts', tenantController.getTenantContracts);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

export default router;