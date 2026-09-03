import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { successResponse, errorResponse } from '../utils/api-response';
import { auditService } from '../services/blockchain/audit.service';
import { config } from '../config';
import { AuthRequest } from '../types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, department } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return errorResponse(res, 400, 'Email already in use');

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          department,
          role: 'OFFICER',
          isActive: false, // Admin must approve
        },
      });

      return successResponse(res, 201, 'Registration successful. Waiting for admin approval.', {
        userId: user.id,
      });
    } catch (e) {
      next(e);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.isActive) {
        return errorResponse(res, 401, 'Invalid credentials or account inactive');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return errorResponse(res, 401, 'Invalid credentials');

      const payload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: String(config.JWT_EXPIRES_IN) as any,
      });
      const refreshToken = jwt.sign({ userId: user.id }, config.JWT_REFRESH_SECRET, {
        expiresIn: String(config.JWT_REFRESH_EXPIRES_IN) as any,
      });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await auditService.log({
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        details: { email },
        ipAddress: req.ip,
      });

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badgeNumber: user.badgeNumber,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return successResponse(res, 200, 'Login successful', {
        accessToken,
        refreshToken,
        user: safeUser,
      });
    } catch (e) {
      next(e);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Accept both { refreshToken } (client) and { token } (legacy)
      const token = req.body.refreshToken ?? req.body.token;
      if (!token) return errorResponse(res, 400, 'Refresh token required');

      const record = await prisma.refreshToken.findFirst({ where: { token } });
      if (!record || record.expiresAt < new Date()) {
        return errorResponse(res, 401, 'Invalid or expired refresh token');
      }

      const user = await prisma.user.findUnique({ where: { id: record.userId } });
      if (!user) return errorResponse(res, 401, 'User not found');

      const payload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: String(config.JWT_EXPIRES_IN) as any,
      });

      return successResponse(res, 200, 'Token refreshed', { accessToken });
    } catch (e) {
      next(e);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = req.body.refreshToken ?? req.body.token;
      if (token) {
        await prisma.refreshToken.deleteMany({ where: { token } });
      }
      return successResponse(res, 200, 'Logged out successfully');
    } catch (e) {
      next(e);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) return errorResponse(res, 404, 'User not found');
      return successResponse(res, 200, 'Profile fetched', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badgeNumber: user.badgeNumber,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, department } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          ...(name !== undefined && { name }),
          ...(department !== undefined && { department }),
        },
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
      return successResponse(res, 200, 'Profile updated', user);
    } catch (e) {
      next(e);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return errorResponse(res, 400, 'Both oldPassword and newPassword are required');
      }
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) return errorResponse(res, 404, 'User not found');

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return errorResponse(res, 400, 'Current password is incorrect');

      if (newPassword.length < 8) {
        return errorResponse(res, 400, 'New password must be at least 8 characters');
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

      return successResponse(res, 200, 'Password changed successfully');
    } catch (e) {
      next(e);
    }
  }
}

export const authController = new AuthController();
