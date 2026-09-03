import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '../utils/api-response';

export class AdminController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 15))));
      const skip = (page - 1) * limit;

      let where: any = {};
      if (req.query.search) {
        const s = String(req.query.search);
        where.OR = [
          { name: { contains: s } },
          { email: { contains: s } },
          { department: { contains: s } },
        ];
      }
      if (req.query.role) where.role = req.query.role;

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            badgeNumber: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      return paginatedResponse(res, 200, 'Users fetched', users, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      next(e);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          badgeNumber: true,
          isActive: true,
          mfaEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!user) return errorResponse(res, 404, 'User not found');
      return successResponse(res, 200, 'User fetched', user);
    } catch (e) {
      next(e);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, department, badgeNumber } = req.body;
      if (!name || !email || !password || !role) {
        return errorResponse(res, 400, 'name, email, password, and role are required');
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return errorResponse(res, 400, 'Email already in use');

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role, department, badgeNumber, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          badgeNumber: true,
          isActive: true,
          createdAt: true,
        },
      });

      return successResponse(res, 201, 'User created', user);
    } catch (e) {
      next(e);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, department, isActive, badgeNumber } = req.body;

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (department !== undefined) updateData.department = department;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (badgeNumber !== undefined) updateData.badgeNumber = badgeNumber;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
      });

      return successResponse(res, 200, 'User updated', user);
    } catch (e) {
      next(e);
    }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return errorResponse(res, 404, 'User not found');

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });

      return successResponse(
        res,
        200,
        `User ${updated.isActive ? 'activated' : 'suspended'}`,
        updated
      );
    } catch (e) {
      next(e);
    }
  }

  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalCases, totalDocuments, totalAuditLogs] = await Promise.all([
        prisma.user.count(),
        prisma.case.count(),
        prisma.document.count(),
        prisma.auditLog.count(),
      ]);

      const [usersByRole, casesByStatus, documentsByType] = await Promise.all([
        prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
        prisma.case.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.document.groupBy({ by: ['fileType'], _count: { fileType: true } }),
      ]);

      return successResponse(res, 200, 'Stats fetched', {
        totalUsers,
        totalCases,
        totalDocuments,
        totalAuditLogs,
        usersByRole: Object.fromEntries(usersByRole.map((r: any) => [r.role, r._count.role])),
        casesByStatus: Object.fromEntries(casesByStatus.map((s: any) => [s.status, s._count.status])),
        documentsByType: Object.fromEntries(
          documentsByType.map((d: any) => [d.fileType, d._count.fileType])
        ),
      });
    } catch (e) {
      next(e);
    }
  }
}

export const adminController = new AdminController();
