import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/api-response';
import { AuthRequest } from '../types';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifs = await prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return successResponse(res, 200, 'Notifications fetched', notifs);
    } catch (e) {
      next(e);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.notification.updateMany({
        where: { id, userId: req.user!.userId },
        data: { isRead: true },
      });
      return successResponse(res, 200, 'Notification marked as read');
    } catch (e) {
      next(e);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, isRead: false },
        data: { isRead: true },
      });
      return successResponse(res, 200, 'All notifications marked as read');
    } catch (e) {
      next(e);
    }
  }
}

export const notificationController = new NotificationController();
