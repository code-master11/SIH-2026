import api from './api';
import type { ApiResponse, User } from '../types';

export const login = (email: string, password: string) =>
  api
    .post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>('/auth/login', {
      email,
      password,
    })
    .then((r) => r.data);

export const register = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  badgeNumber?: string;
}) => api.post<ApiResponse<User>>('/auth/register', data).then((r) => r.data);

export const logout = (refreshToken: string) =>
  api.post<ApiResponse<null>>('/auth/logout', { refreshToken }).then((r) => r.data);

export const refreshAccessToken = (refreshToken: string) =>
  api
    .post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken })
    .then((r) => r.data);

export const getProfile = () =>
  api.get<ApiResponse<User>>('/auth/profile').then((r) => r.data);

export const updateProfile = (data: { name?: string; department?: string }) =>
  api.patch<ApiResponse<User>>('/auth/profile', data).then((r) => r.data);

export const changePassword = (oldPassword: string, newPassword: string) =>
  api
    .post<ApiResponse<null>>('/auth/change-password', { oldPassword, newPassword })
    .then((r) => r.data);
