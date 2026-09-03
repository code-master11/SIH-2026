import api from './api';
import type { ApiResponse, PaginatedResponse, AuditLog, BlockchainVerification } from '../types';

export const getAuditLogs = (params?: Record<string, string | number>) =>
  api.get<PaginatedResponse<AuditLog>>('/audit', { params }).then((r) => r.data);

export const verifyBlockchain = () =>
  api.get<ApiResponse<BlockchainVerification>>('/audit/verify').then((r) => r.data);

export const getDocumentAudit = (documentId: string) =>
  api.get<ApiResponse<AuditLog[]>>(`/audit/documents/${documentId}`).then((r) => r.data);

export const getCaseAudit = (caseId: string) =>
  api.get<ApiResponse<AuditLog[]>>(`/audit/cases/${caseId}`).then((r) => r.data);

export const exportAudit = async () => {
  const res = await api.get('/audit/export', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
