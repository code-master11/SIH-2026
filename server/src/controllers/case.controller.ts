import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '../utils/api-response';
import { auditService } from '../services/blockchain/audit.service';
import { AuthRequest } from '../types';

export class CaseController {
  async createCase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, type, priority, departmentId, location } = req.body;
      const caseNumber = `CS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`;

      const newCase = await prisma.case.create({
        data: {
          caseNumber,
          title,
          description,
          type,
          priority,
          status: 'OPEN',
          createdById: req.user!.userId,
          departmentId,
          location,
        },
      });

      await auditService.log({
        action: 'CREATE_CASE',
        entityType: 'CASE',
        entityId: newCase.id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { caseNumber, title },
        ipAddress: req.ip,
      });

      return successResponse(res, 201, 'Case created', newCase);
    } catch (e) {
      next(e);
    }
  }

  async getCases(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const userId = req.user!.userId;
      const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 15))));
      const skip = (page - 1) * limit;

      let where: any = {};

      // RBAC filter
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
        where.OR = [{ createdById: userId }, { assignedToId: userId }];
      }

      // Optional filters
      if (req.query.status) where.status = req.query.status;
      if (req.query.priority) where.priority = req.query.priority;
      if (req.query.type) where.type = req.query.type;
      if (req.query.search) {
        const s = String(req.query.search);
        const searchFilter = {
          OR: [
            { title: { contains: s } },
            { caseNumber: { contains: s } },
            { description: { contains: s } },
          ],
        };
        where = where.OR ? { AND: [where, searchFilter] } : { ...where, ...searchFilter };
      }

      const [total, cases] = await Promise.all([
        prisma.case.count({ where }),
        prisma.case.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            createdBy: { select: { name: true } },
            assignedTo: { select: { name: true } },
            _count: { select: { documents: true } },
          },
        }),
      ]);

      return paginatedResponse(res, 200, 'Cases fetched', cases, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      next(e);
    }
  }

  async getCaseById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const caseData = await prisma.case.findUnique({
        where: { id },
        include: {
          createdBy: { select: { name: true } },
          assignedTo: { select: { name: true } },
          documents: true,
        },
      });

      if (!caseData) return errorResponse(res, 404, 'Case not found');

      const userRole = req.user!.role;
      const userId = req.user!.userId;
      if (
        userRole !== 'SUPER_ADMIN' &&
        userRole !== 'ADMIN' &&
        userRole !== 'AUDITOR' &&
        caseData.createdById !== userId &&
        caseData.assignedToId !== userId
      ) {
        return errorResponse(res, 403, 'Forbidden');
      }

      return successResponse(res, 200, 'Case fetched', caseData);
    } catch (e) {
      next(e);
    }
  }

  async updateCase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const allowedFields = ['title', 'description', 'status', 'priority', 'assignedToId', 'location'];
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      }

      const updatedCase = await prisma.case.update({ where: { id }, data: updateData });

      await auditService.log({
        action: 'UPDATE_CASE',
        entityType: 'CASE',
        entityId: id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: updateData,
        ipAddress: req.ip,
      });

      return successResponse(res, 200, 'Case updated', updatedCase);
    } catch (e) {
      next(e);
    }
  }

  async deleteCase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.case.findUnique({ where: { id } });
      if (!existing) return errorResponse(res, 404, 'Case not found');

      await prisma.case.delete({ where: { id } });

      await auditService.log({
        action: 'DELETE_CASE',
        entityType: 'CASE',
        entityId: id,
        userId: req.user!.userId,
        userName: req.user!.email,
        userRole: req.user!.role,
        details: { caseNumber: existing.caseNumber },
        ipAddress: req.ip,
      });

      return successResponse(res, 200, 'Case deleted');
    } catch (e) {
      next(e);
    }
  }

  async getCaseStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [totalCases, totalDocuments, totalUsers, totalAuditLogs, casesByStatus, casesByType] =
        await Promise.all([
          prisma.case.count(),
          prisma.document.count(),
          prisma.user.count(),
          prisma.auditLog.count(),
          prisma.case.groupBy({ by: ['status'], _count: { status: true } }),
          prisma.case.groupBy({ by: ['type'], _count: { type: true } }),
        ]);

      const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: { role: true } });

      return successResponse(res, 200, 'Stats fetched', {
        totalCases,
        totalDocuments,
        totalUsers,
        totalAuditLogs,
        casesByStatus: Object.fromEntries(casesByStatus.map((s: any) => [s.status, s._count.status])),
        casesByType: Object.fromEntries(casesByType.map((t: any) => [t.type, t._count.type])),
        usersByRole: Object.fromEntries(usersByRole.map((r: any) => [r.role, r._count.role])),
      });
    } catch (e) {
      next(e);
    }
  }

  async getCaseTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const logs = await prisma.auditLog.findMany({
        where: { entityId: id, entityType: 'CASE' },
        orderBy: { createdAt: 'asc' },
      });
      return successResponse(res, 200, 'Timeline fetched', logs);
    } catch (e) {
      next(e);
    }
  }

  async getCaseDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const docs = await prisma.document.findMany({
        where: { caseId: id },
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return successResponse(res, 200, 'Documents fetched', docs);
    } catch (e) {
      next(e);
    }
  }
}

export const caseController = new CaseController();
