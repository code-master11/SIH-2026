import { Router } from 'express';
import { caseController } from '../controllers/case.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { caseValidators } from '../utils/validators';

const router = Router();

router.use(authenticate);

// Stats — must come before /:id to avoid being swallowed as an id param
router.get('/stats', caseController.getCaseStats);

router.post('/', caseValidators.create, validateRequest, caseController.createCase);
router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);
router.get('/:id/timeline', caseController.getCaseTimeline);
router.get('/:id/documents', caseController.getCaseDocuments);

export default router;
