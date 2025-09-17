import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateSettings, validateBulkSettings, validateImportSettings } from '../validations/settingsValidation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all settings
router.get('/', settingsController.getAllSettings);

// Get setting by key
router.get('/key/:key', settingsController.getSettingByKey);

// Create new setting
router.post('/', validateSettings, settingsController.createSetting);

// Update setting by ID
router.put('/:id', validateSettings, settingsController.updateSetting);

// Update multiple settings (bulk update)
router.put('/bulk', validateBulkSettings, settingsController.updateMultipleSettings);

// Delete setting
router.delete('/:id', settingsController.deleteSetting);

// Export settings
router.get('/export', settingsController.exportSettings);

// Import settings
router.post('/import', validateImportSettings, settingsController.importSettings);

// Reset to default settings
router.post('/reset', settingsController.resetToDefault);

export default router;