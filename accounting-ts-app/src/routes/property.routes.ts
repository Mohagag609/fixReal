import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';

const router = Router();
const propertyController = new PropertyController();

// Property routes
router.post('/', propertyController.createProperty);
router.get('/', propertyController.getAllProperties);
router.get('/search', propertyController.searchProperties);
router.get('/summary', propertyController.getPropertySummary);
router.get('/status/:status', propertyController.getPropertiesByStatus);
router.get('/type/:type', propertyController.getPropertiesByType);
router.get('/:id', propertyController.getPropertyById);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

export default router;