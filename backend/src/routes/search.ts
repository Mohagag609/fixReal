import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateSearchQuery } from '../validations/searchValidation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Advanced search
router.post('/advanced', validateSearchQuery, searchController.advancedSearch);

// Quick search
router.get('/quick', searchController.quickSearch);

// Search suggestions
router.get('/suggestions', searchController.getSuggestions);

// Search history
router.get('/history', searchController.getSearchHistory);
router.post('/history', searchController.saveSearchHistory);
router.delete('/history/:id', searchController.deleteSearchHistory);

// Search analytics
router.get('/analytics', searchController.getSearchAnalytics);

export default router;