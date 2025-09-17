import { Router } from 'express';
import { notificationsController } from '../controllers/notificationsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateNotification, validateNotificationUpdate, validateNotificationFilters } from '../validations/notificationsValidation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all notifications with filters
router.get('/', validateNotificationFilters, notificationsController.getAllNotifications);

// Get notification by ID
router.get('/:id', notificationsController.getNotificationById);

// Create new notification
router.post('/', validateNotification, notificationsController.createNotification);

// Update notification
router.put('/:id', validateNotificationUpdate, notificationsController.updateNotification);

// Acknowledge notification
router.put('/:id/acknowledge', notificationsController.acknowledgeNotification);

// Acknowledge all notifications
router.put('/acknowledge-all', notificationsController.acknowledgeAllNotifications);

// Unacknowledge notification
router.put('/:id/unacknowledge', notificationsController.unacknowledgeNotification);

// Delete notification
router.delete('/:id', notificationsController.deleteNotification);

// Delete all acknowledged notifications
router.delete('/acknowledged', notificationsController.deleteAcknowledgedNotifications);

// Get unread count
router.get('/unread/count', notificationsController.getUnreadCount);

// Clean expired notifications
router.post('/clean-expired', notificationsController.cleanExpiredNotifications);

export default router;