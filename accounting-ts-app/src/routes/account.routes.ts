import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';

const router = Router();
const accountController = new AccountController();

// Account routes
router.post('/', accountController.createAccount);
router.get('/', accountController.getAllAccounts);
router.get('/summary', accountController.getAccountSummary);
router.get('/type/:type', accountController.getAccountsByType);
router.get('/:id', accountController.getAccountById);
router.get('/:id/balance', accountController.getAccountBalance);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

export default router;