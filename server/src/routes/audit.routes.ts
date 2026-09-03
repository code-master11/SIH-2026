import { Router, Request, Response, NextFunction } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR'));

router.get('/', auditController.getAuditLogs);
router.get('/verify', auditController.verifyBlockchain);
// Export must be before /:entityType/:entityId to avoid ambiguity
router.get('/export', auditController.exportAuditLogs);
// Entity-scoped audit shortcuts
router.get('/documents/:entityId', (req: Request, res: Response, next: NextFunction) => {
  (req.params as any).entityType = 'DOCUMENT';
  auditController.getEntityAudit(req, res, next);
});
router.get('/cases/:entityId', (req: Request, res: Response, next: NextFunction) => {
  (req.params as any).entityType = 'CASE';
  auditController.getEntityAudit(req, res, next);
});
// Generic entity audit
router.get('/:entityType/:entityId', auditController.getEntityAudit);

export default router;
