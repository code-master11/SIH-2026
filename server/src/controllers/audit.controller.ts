import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '../utils/api-response';
import { auditService } from '../services/blockchain/audit.service';

export class AuditController {
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
      const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? 20))));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (req.query.action) where.action = req.query.action;
      if (req.query.userId) where.userId = req.query.userId;
      if (req.query.entityType) where.entityType = req.query.entityType;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return paginatedResponse(res, 200, 'Logs fetched', logs, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      next(e);
    }
  }

  async verifyBlockchain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditService.verifyChain();
      return successResponse(res, 200, 'Verification complete', result);
    } catch (e) {
      next(e);
    }
  }

  async exportAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-export-${Date.now()}.json"`
      );
      return res.json({
        exported: new Date().toISOString(),
        totalRecords: logs.length,
        logs,
      });
    } catch (e) {
      next(e);
    }
  }

  async getEntityAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType: entityType.toUpperCase(),
          entityId,
        },
        orderBy: { createdAt: 'asc' },
      });
      return successResponse(res, 200, 'Entity audit logs fetched', logs);
    } catch (e) {
      next(e);
    }
  }
}

export const auditController = new AuditController();
