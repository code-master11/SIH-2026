import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.get('/stats', adminController.getSystemStats);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUser);
router.patch('/users/:id/suspend', adminController.suspendUser);

// Keep backward-compat PUT alias for updateUser
router.put('/users/:id', adminController.updateUser);

export default router;
