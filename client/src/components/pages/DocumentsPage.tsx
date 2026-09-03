import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Upload,
  Search,
  ChevronRight,
  X,
  UploadCloud,
} from 'lucide-react';
import { getDocuments, uploadDocument } from '../../services/document.service';
import { getCases } from '../../services/case.service';
import { useAuthStore } from '../../store/auth.store';
import { Card, Badge, Spinner, EmptyState, Pagination } from '../ui/index';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  formatShortDate,
  formatFileSize,
  getAccessLevelColor,
  getFileIcon,
} from '../../utils/helpers';
import { ACCESS_LEVELS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../../utils/constants';
import type { Document, Case } from '../../types';
import toast from 'react-hot-toast';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR', 'OFFICER'];

// ─── Upload Modal ─────────────────────────────────────────────────────────────
const UploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    caseId: '',
    accessLevel: 'RESTRICTED',
    tags: '',
  });

  const { data: casesData } = useQuery({
    queryKey: ['cases-list'],
    queryFn: () => getCases({ limit: 100 }),
  });
  const cases: Case[] = (casesData as any)?.data ?? [];

  const mutation = useMutation({
    mutationFn: (fd: FormData) => uploadDocument(fd, setProgress),
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Upload failed');
      setProgress(0);
    },
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      if (!form.title) setForm((f) => ({ ...f, title: accepted[0].name.replace(/\.[^/.]+$/, '') }));
    }
  }, [form.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES.reduce((acc, t) => ({ ...acc, [t]: [] }), {}),
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    onDropRejected: (rejected) => {
      const err = rejected[0]?.errors[0];
      toast.error(err?.code === 'file-too-large' ? 'File exceeds 50MB limit' : 'File type not allowed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.caseId) { toast.error('Please select a case'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('caseId', form.caseId);
    fd.append('accessLevel', form.accessLevel);
    fd.append('tags', form.tags);
    mutation.mutate(fd);
  };

  return (
    <Modal isOpen onClose={onClose} title="Upload Document" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : file
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-emerald-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <UploadCloud className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, MP4 · Max 50MB</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {mutation.isPending && (
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Uploading & encrypting…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <Input
          label="Title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Document title"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Optional description..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Case *</label>
            <select
              value={form.caseId}
              onChange={(e) => setForm((f) => ({ ...f, caseId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select case…</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.caseNumber} – {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Level *</label>
            <select
              value={form.accessLevel}
              onChange={(e) => setForm((f) => ({ ...f, accessLevel: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(ACCESS_LEVELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Tags"
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="comma, separated, tags"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending} className="flex items-center gap-1.5">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Documents Page ───────────────────────────────────────────────────────────
export const DocumentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = WRITE_ROLES.includes(user?.role ?? '');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterAccess, setFilterAccess] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { page, search, filterAccess }],
    queryFn: () =>
      getDocuments({
        page,
        limit: 15,
        ...(search ? { search } : {}),
        ...(filterAccess ? { accessLevel: filterAccess } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const docs: Document[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">Encrypted evidence and case files</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        )}
      </div>

      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search documents..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterAccess}
            onChange={(e) => { setFilterAccess(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Access Levels</option>
            {Object.entries(ACCESS_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {(search || filterAccess) && (
            <button
              onClick={() => { setSearch(''); setFilterAccess(''); setPage(1); }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No documents found"
            description={search ? 'Adjust your search or filters.' : 'Upload your first document.'}
            action={
              canWrite ? (
                <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Document
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {docs.map((doc) => {
                const Icon = getFileIcon(doc.mimeType);
                return (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {doc.fileName} · {formatFileSize(doc.fileSize)} · {formatShortDate(doc.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.isSigned && (
                        <Badge className="bg-emerald-100 text-emerald-800">Signed</Badge>
                      )}
                      <Badge className={getAccessLevelColor(doc.accessLevel)}>{doc.accessLevel}</Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
            {pagination && (
              <div className="px-5 py-3 border-t border-slate-100">
                <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
};
