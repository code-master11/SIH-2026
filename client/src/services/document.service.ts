import api from './api';
import type { ApiResponse, PaginatedResponse, Document, Comment, Signature } from '../types';

// ─── Documents ────────────────────────────────────────────────────────────────

export const getDocuments = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<Document>>('/documents', { params }).then((r) => r.data);

export const getDocumentById = (id: string) =>
  api.get<ApiResponse<Document>>(`/documents/${id}`).then((r) => r.data);

export const uploadDocument = (formData: FormData, onProgress?: (pct: number) => void) =>
  api
    .post<ApiResponse<Document>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);

export const updateDocument = (id: string, formData: FormData) =>
  api
    .patch<ApiResponse<Document>>(`/documents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const deleteDocument = (id: string) =>
  api.delete<ApiResponse<null>>(`/documents/${id}`).then((r) => r.data);

export const downloadDocument = async (id: string, fileName: string) => {
  const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const signDocument = (id: string) =>
  api.post<ApiResponse<Signature>>(`/documents/${id}/sign`).then((r) => r.data);

export const verifySignature = (id: string) =>
  api.get<ApiResponse<{ isValid: boolean; signature: Signature }>>(`/documents/${id}/verify`).then((r) => r.data);

export const getVersionHistory = (id: string) =>
  api.get<ApiResponse<Document[]>>(`/documents/${id}/versions`).then((r) => r.data);

export const getComments = (id: string) =>
  api.get<ApiResponse<Comment[]>>(`/documents/${id}/comments`).then((r) => r.data);

export const addComment = (id: string, content: string) =>
  api.post<ApiResponse<Comment>>(`/documents/${id}/comments`, { content }).then((r) => r.data);

export const generateShareLink = (id: string) =>
  api.get<ApiResponse<{ shareUrl: string; expiresAt: string }>>(`/documents/${id}/share`).then((r) => r.data);
