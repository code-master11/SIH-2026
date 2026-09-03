// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INVESTIGATOR'
  | 'OFFICER'
  | 'LEGAL_COUNSEL'
  | 'AUDITOR';

export type CaseType = 'FIR' | 'INVESTIGATION' | 'COURT' | 'CIVIL' | 'CRIMINAL';

export type CaseStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'PENDING_COURT'
  | 'CLOSED'
  | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AccessLevel = 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'TOP_SECRET';

export type NotifType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

// ─── Core Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  badgeNumber?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  createdById: string;
  assignedToId?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  createdBy?: User;
  assignedTo?: User;
  documents?: Document[];
  _count?: { documents: number };
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  tags?: string;
  caseId: string;
  uploadedById: string;
  version: number;
  isLatest: boolean;
  parentId?: string;
  isSigned: boolean;
  signedById?: string;
  signedAt?: string;
  isRedacted: boolean;
  accessLevel: AccessLevel;
  createdAt: string;
  updatedAt: string;
  case?: Case;
  uploadedBy?: User;
  signatures?: Signature[];
  comments?: Comment[];
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  blockHash: string;
  previousHash: string;
  blockIndex: number;
  createdAt: string;
}

export interface Signature {
  id: string;
  documentId: string;
  signedById: string;
  publicKey: string;
  signature: string;
  algorithm: string;
  isValid: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  documentId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotifType;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  type: 'document' | 'case';
  id: string;
  title: string;
  score: number;
  snippet?: string;
  metadata: Record<string, unknown>;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface SystemStats {
  totalUsers: number;
  totalCases: number;
  totalDocuments: number;
  totalAuditLogs: number;
  usersByRole: Record<string, number>;
  casesByStatus: Record<string, number>;
  documentsByType: Record<string, number>;
}

export interface BlockchainVerification {
  isValid: boolean;
  brokenAt?: number;
  totalBlocks: number;
}
