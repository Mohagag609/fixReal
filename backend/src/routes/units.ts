import { Router } from 'express';
import { UnitController } from '../controllers/unitController';
import { authenticate } from '../middleware/auth';
import {
  validateUnit,
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All unit routes require authentication
router.use(authenticate);

// Unit CRUD operations
router.get('/', validatePagination, UnitController.getAllUnits);
router.get('/search', validateSearch, UnitController.getAllUnits);
router.get('/available', UnitController.getUnitsByType);
router.get('/type/:type', UnitController.getUnitsByType);
router.get('/:id', validateId, UnitController.getUnitById);
router.post('/', validateUnit, UnitController.createUnit);
router.put('/:id', validateId, validateUnit, UnitController.updateUnit);
router.delete('/:id', validateId, UnitController.deleteUnit);

// Unit specific operations
router.get('/:id/contracts', validateId, UnitController.getUnitContracts);
router.get('/:id/stats', validateId, UnitController.getUnitStats);

export default router;