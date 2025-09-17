import { Router } from 'express';
import { PartnerController } from '../controllers/partnerController';
import { authenticate } from '../middleware/auth';
import {
  validateId,
  validateSearch,
  validatePagination
} from '../middleware/validation';

const router = Router();

// All partner routes require authentication
router.use(authenticate);

// Partner CRUD operations
router.get('/', validatePagination, PartnerController.getAllPartners);
router.get('/search', validateSearch, PartnerController.getAllPartners);
router.get('/:id', validateId, PartnerController.getPartnerById);
router.post('/', PartnerController.createPartner);
router.put('/:id', validateId, PartnerController.updatePartner);
router.delete('/:id', validateId, PartnerController.deletePartner);

// Partner specific operations
router.get('/:id/units', validateId, PartnerController.getPartnerUnits);
router.get('/:id/stats', validateId, PartnerController.getPartnerStats);

export default router;