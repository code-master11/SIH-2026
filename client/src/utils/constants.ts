export const ROLES = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  ADMIN: { label: 'Admin', color: 'bg-indigo-100 text-indigo-800' },
  INVESTIGATOR: { label: 'Investigator', color: 'bg-blue-100 text-blue-800' },
  OFFICER: { label: 'Officer', color: 'bg-green-100 text-green-800' },
  LEGAL_COUNSEL: { label: 'Legal Counsel', color: 'bg-purple-100 text-purple-800' },
  AUDITOR: { label: 'Auditor', color: 'bg-amber-100 text-amber-800' },
} as const;

export const CASE_TYPES = {
  FIR: { label: 'FIR', color: 'bg-red-100 text-red-800' },
  INVESTIGATION: { label: 'Investigation', color: 'bg-blue-100 text-blue-800' },
  COURT: { label: 'Court', color: 'bg-purple-100 text-purple-800' },
  CIVIL: { label: 'Civil', color: 'bg-teal-100 text-teal-800' },
  CRIMINAL: { label: 'Criminal', color: 'bg-orange-100 text-orange-800' },
} as const;

export const CASE_STATUSES = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  UNDER_INVESTIGATION: { label: 'Under Investigation', color: 'bg-amber-100 text-amber-800' },
  PENDING_COURT: { label: 'Pending Court', color: 'bg-purple-100 text-purple-800' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-600' },
} as const;

export const CASE_PRIORITIES = {
  LOW: { label: 'Low', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-800' },
} as const;

export const ACCESS_LEVELS = {
  PUBLIC: { label: 'Public', color: 'bg-green-100 text-green-800', description: 'Accessible by all authorized users' },
  RESTRICTED: { label: 'Restricted', color: 'bg-yellow-100 text-yellow-800', description: 'Limited departmental access' },
  CONFIDENTIAL: { label: 'Confidential', color: 'bg-orange-100 text-orange-800', description: 'Investigators and above only' },
  TOP_SECRET: { label: 'Top Secret', color: 'bg-red-100 text-red-800', description: 'Admin and Super Admin only' },
} as const;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'video/mp4',
  'video/avi',
  'text/plain',
  'text/csv',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.mp4', '.avi', '.txt', '.csv'];

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
export const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR', 'OFFICER'];
export const READ_ONLY_ROLES = ['LEGAL_COUNSEL', 'AUDITOR'];

export const AUDIT_ACTIONS: Record<string, string> = {
  // Legacy
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout',
  DOCUMENT_UPLOAD: 'Document Uploaded',
  DOCUMENT_DOWNLOAD: 'Document Downloaded',
  DOCUMENT_VIEW: 'Document Viewed',
  DOCUMENT_DELETE: 'Document Deleted',
  DOCUMENT_SIGN: 'Document Signed',
  DOCUMENT_UPDATE: 'Document Updated',
  CASE_CREATE: 'Case Created',
  CASE_UPDATE: 'Case Updated',
  CASE_DELETE: 'Case Deleted',
  USER_CREATE: 'User Created',
  USER_UPDATE: 'User Updated',
  // Server action names
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  UPLOAD_DOCUMENT: 'Document Uploaded',
  DOWNLOAD_DOCUMENT: 'Document Downloaded',
  VIEW_DOCUMENT: 'Document Viewed',
  DELETE_DOCUMENT: 'Document Deleted',
  SIGN_DOCUMENT: 'Document Signed',
  CREATE_CASE: 'Case Created',
  UPDATE_CASE: 'Case Updated',
  DELETE_CASE: 'Case Deleted',
  CREATE: 'Created',
};

