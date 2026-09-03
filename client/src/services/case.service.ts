import api from './api';
import type { ApiResponse, PaginatedResponse, Case, AuditLog, SystemStats } from '../types';

// ─── Cases ────────────────────────────────────────────────────────────────────

export const getCases = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<Case>>('/cases', { params }).then((r) => r.data);

export const getCaseById = (id: string) =>
  api.get<ApiResponse<Case>>(`/cases/${id}`).then((r) => r.data);

export const createCase = (data: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  location?: string;
}) => api.post<ApiResponse<Case>>('/cases', data).then((r) => r.data);

export const updateCase = (id: string, data: Partial<Case>) =>
  api.patch<ApiResponse<Case>>(`/cases/${id}`, data).then((r) => r.data);

export const deleteCase = (id: string) =>
  api.delete<ApiResponse<null>>(`/cases/${id}`).then((r) => r.data);

export const getCaseDocuments = (id: string) =>
  api.get(`/cases/${id}/documents`).then((r) => r.data);

export const getCaseTimeline = (id: string): Promise<ApiResponse<AuditLog[]>> =>
  api.get(`/cases/${id}/timeline`).then((r) => r.data);

export const addCollaborator = (caseId: string, userId: string) =>
  api.post(`/cases/${caseId}/collaborators`, { userId }).then((r) => r.data);

export const getCaseStats = () =>
  api.get<ApiResponse<SystemStats>>('/cases/stats').then((r) => r.data);
