import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { authValidators } from '../utils/validators';

const router = Router();

router.post('/register', authLimiter, authValidators.register, validateRequest, authController.register);
router.post('/login', authLimiter, authValidators.login, validateRequest, authController.login);
// Client sends { refreshToken } — controller also accepts legacy { token }
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
