import api from './api';
import type { ApiResponse, Notification } from '../types';

export const getNotifications = () =>
  api.get<ApiResponse<Notification[]>>('/notifications').then((r) => r.data);

export const markAsRead = (id: string) =>
  api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`).then((r) => r.data);

export const markAllAsRead = () =>
  api.patch<ApiResponse<null>>('/notifications/read-all').then((r) => r.data);
