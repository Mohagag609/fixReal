import { Router } from 'express';
import { BrokerController } from '../controllers/brokerController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { brokerValidation } from '../validations/brokerValidation';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all brokers with pagination and search
router.get('/', BrokerController.getAllBrokers);

// Get broker by ID
router.get('/:id', BrokerController.getBrokerById);

// Create new broker
router.post('/', 
  validateRequest(brokerValidation.createBroker),
  BrokerController.createBroker
);

// Update broker
router.put('/:id',
  validateRequest(brokerValidation.updateBroker),
  BrokerController.updateBroker
);

// Delete broker (soft delete)
router.delete('/:id', BrokerController.deleteBroker);

// Get broker contracts
router.get('/:id/contracts', BrokerController.getBrokerContracts);

// Get broker statistics
router.get('/:id/stats', BrokerController.getBrokerStats);

// Search brokers
router.get('/search/:term', BrokerController.searchBrokers);

// Get brokers by status
router.get('/status/:status', BrokerController.getBrokersByStatus);

export default router;