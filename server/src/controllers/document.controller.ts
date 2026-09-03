import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '../utils/api-response';
import { fileService } from '../services/storage/file.service';
import { auditService } from '../services/blockchain/audit.service';
import { signatureService } from '../services/crypto/signature.service';
import { AuthRequest } from '../types';

export class DocumentController {
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) return errorResponse(res, 400, 'No file provided');

      const { title, description, caseId, accessLevel, tags } = req.body;
      if (!caseId) return errorResponse(res, 400, 'caseId is required');

      const { filePath, checksum, encryptedKey, iv, fileSize } = await fileService.saveFile(
        req.file.path,
        req.file.originalname
      );

      const doc = await prisma.document.create({
        data: {
          title: title || req.file.originalname,
          description,
          fileType: req.file.originalname.split('.').pop() || '',
          fileName: req.file.originalname,
          filePath,
          fileSize,
          mimeType: req.file.mimetype,
          checksum,
          encryptedKey,
          iv,
          tags,
          caseId,
          uploadedById: req.user!.userId,
          accessLevel: accessLevel || 'RESTRICTED',
        },
      });

      await auditService.log({
        action: 'UPLOAD_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: doc.id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { title: doc.title, caseId },
        ipAddress: req.ip,
      });

      return successResponse(res, 201, 'Document uploaded', doc);
    } catch (e) {
      next(e);
    }
  }

  async getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 15))));
      const skip = (page - 1) * limit;

      let where: any = {};
      if (req.query.caseId) where.caseId = req.query.caseId;
      if (req.query.accessLevel) where.accessLevel = req.query.accessLevel;
      if (req.query.search) {
        const s = String(req.query.search);
        where.OR = [
          { title: { contains: s } },
          { fileName: { contains: s } },
          { tags: { contains: s } },
        ];
      }

      const [total, docs] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            uploadedBy: { select: { name: true } },
            case: { select: { id: true, caseNumber: true, title: true } },
          },
        }),
      ]);

      return paginatedResponse(res, 200, 'Documents fetched', docs, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      next(e);
    }
  }

  async getDocumentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await prisma.document.findUnique({
        where: { id },
        include: {
          uploadedBy: { select: { name: true, email: true } },
          case: { select: { id: true, caseNumber: true, title: true } },
          signatures: true,
          comments: {
            include: { author: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!doc) return errorResponse(res, 404, 'Document not found');

      await auditService.log({
        action: 'VIEW_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { fileName: doc.fileName },
        ipAddress: req.ip,
      });

      return successResponse(res, 200, 'Document fetched', doc);
    } catch (e) {
      next(e);
    }
  }

  async downloadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) return errorResponse(res, 404, 'Document not found');

      const buffer = await fileService.getFile(doc.filePath, doc.encryptedKey, doc.iv);

      await auditService.log({
        action: 'DOWNLOAD_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: doc.id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { fileName: doc.fileName },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
      res.setHeader('Content-Type', doc.mimeType);
      return res.send(buffer);
    } catch (e) {
      next(e);
    }
  }

  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) return errorResponse(res, 404, 'Document not found');

      await fileService.deleteFile(doc.filePath);
      await prisma.document.delete({ where: { id } });

      await auditService.log({
        action: 'DELETE_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { fileName: doc.fileName },
        ipAddress: req.ip,
      });

      return successResponse(res, 200, 'Document deleted');
    } catch (e) {
      next(e);
    }
  }

  async signDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) return errorResponse(res, 404, 'Document not found');

      const { publicKey, signature, algorithm } = signatureService.signDocument(
        doc.checksum,
        req.user!.userId
      );

      const sig = await prisma.signature.create({
        data: { documentId: id, signedById: req.user!.userId, publicKey, signature, algorithm },
      });

      await prisma.document.update({
        where: { id },
        data: { isSigned: true, signedById: req.user!.userId, signedAt: new Date() },
      });

      await auditService.log({
        action: 'SIGN_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { fileName: doc.fileName },
        ipAddress: req.ip,
      });

      return successResponse(res, 200, 'Document signed', sig);
    } catch (e) {
      next(e);
    }
  }

  async verifySignature(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await prisma.document.findUnique({
        where: { id },
        include: { signatures: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (!doc) return errorResponse(res, 404, 'Document not found');

      const latestSig = doc.signatures[0];
      if (!latestSig) {
        return successResponse(res, 200, 'No signature found', { isValid: false, signature: null });
      }

      const isValid = signatureService.verifySignature(
        doc.checksum,
        latestSig.signature,
        latestSig.publicKey
      );

      return successResponse(res, 200, 'Verification complete', { isValid, signature: latestSig });
    } catch (e) {
      next(e);
    }
  }

  async getVersionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) return errorResponse(res, 404, 'Document not found');

      const rootId = doc.parentId ?? id;
      const versions = await prisma.document.findMany({
        where: { OR: [{ id: rootId }, { parentId: rootId }] },
        orderBy: { version: 'asc' },
      });

      return successResponse(res, 200, 'Versions fetched', versions);
    } catch (e) {
      next(e);
    }
  }

  async getComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const comments = await prisma.comment.findMany({
        where: { documentId: id },
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return successResponse(res, 200, 'Comments fetched', comments);
    } catch (e) {
      next(e);
    }
  }

  async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content?.trim()) return errorResponse(res, 400, 'Comment content is required');

      const comment = await prisma.comment.create({
        data: { content: content.trim(), documentId: id, authorId: req.user!.userId },
        include: { author: { select: { name: true, email: true } } },
      });

      return successResponse(res, 201, 'Comment added', comment);
    } catch (e) {
      next(e);
    }
  }
}

export const documentController = new DocumentController();
