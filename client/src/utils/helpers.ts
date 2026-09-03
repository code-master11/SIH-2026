import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  FileText,
  Image,
  Film,
  File,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (date: string): string => {
  try {
    return format(parseISO(date), 'dd MMM yyyy, hh:mm a');
  } catch {
    return date;
  }
};

export const formatShortDate = (date: string): string => {
  try {
    return format(parseISO(date), 'dd MMM yyyy');
  } catch {
    return date;
  }
};

export const formatRelativeTime = (date: string): string => {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
};

export const getFileIcon = (mimeType: string): LucideIcon => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return FileSpreadsheet;
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text'))
    return FileText;
  return File;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    UNDER_INVESTIGATION: 'bg-amber-100 text-amber-800',
    PENDING_COURT: 'bg-purple-100 text-purple-800',
    CLOSED: 'bg-gray-100 text-gray-700',
    ARCHIVED: 'bg-slate-100 text-slate-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
};

export const getPriorityColor = (priority: string): string => {
  const map: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-700';
};

export const getRoleColor = (role: string): string => {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-indigo-100 text-indigo-800',
    INVESTIGATOR: 'bg-blue-100 text-blue-800',
    OFFICER: 'bg-green-100 text-green-800',
    LEGAL_COUNSEL: 'bg-purple-100 text-purple-800',
    AUDITOR: 'bg-amber-100 text-amber-800',
  };
  return map[role] ?? 'bg-gray-100 text-gray-700';
};

export const getAccessLevelColor = (level: string): string => {
  const map: Record<string, string> = {
    PUBLIC: 'bg-green-100 text-green-800',
    RESTRICTED: 'bg-yellow-100 text-yellow-800',
    CONFIDENTIAL: 'bg-orange-100 text-orange-800',
    TOP_SECRET: 'bg-red-100 text-red-800',
  };
  return map[level] ?? 'bg-gray-100 text-gray-700';
};

export const getCaseTypeColor = (type: string): string => {
  const map: Record<string, string> = {
    FIR: 'bg-red-100 text-red-800',
    INVESTIGATION: 'bg-blue-100 text-blue-800',
    COURT: 'bg-purple-100 text-purple-800',
    CIVIL: 'bg-teal-100 text-teal-800',
    CRIMINAL: 'bg-orange-100 text-orange-800',
  };
  return map[type] ?? 'bg-gray-100 text-gray-700';
};

export const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

export const generateInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');
