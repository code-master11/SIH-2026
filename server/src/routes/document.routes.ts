import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

// Upload: client posts to POST /documents (primary) and /documents/upload (legacy)
router.post('/', uploadLimiter, upload.single('file'), documentController.uploadDocument);
router.post('/upload', uploadLimiter, upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);

// Specific sub-resource routes before /:id to avoid param collision
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id/verify', documentController.verifySignature);
router.get('/:id/versions', documentController.getVersionHistory);
router.get('/:id/comments', documentController.getComments);
router.post('/:id/comments', documentController.addComment);
router.post('/:id/sign', documentController.signDocument);

// CRUD for a single document
router.get('/:id', documentController.getDocumentById);
router.delete('/:id', documentController.deleteDocument);

export default router;
