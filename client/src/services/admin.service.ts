import api from './api';
import type { ApiResponse, PaginatedResponse, User, SystemStats } from '../types';

export const getUsers = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data);

export const getUserById = (id: string) =>
  api.get<ApiResponse<User>>(`/admin/users/${id}`).then((r) => r.data);

export const createUser = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  badgeNumber?: string;
}) => api.post<ApiResponse<User>>('/admin/users', data).then((r) => r.data);

export const updateUser = (id: string, data: Partial<User>) =>
  api.patch<ApiResponse<User>>(`/admin/users/${id}`, data).then((r) => r.data);

export const suspendUser = (id: string) =>
  api.patch<ApiResponse<User>>(`/admin/users/${id}/suspend`).then((r) => r.data);

export const getSystemStats = () =>
  api.get<ApiResponse<SystemStats>>('/admin/stats').then((r) => r.data);
