import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Clock,
  Edit2,
  Trash2,
  MapPin,
  User,
  Calendar,
} from 'lucide-react';
import {
  getCaseById,
  updateCase,
  deleteCase,
  getCaseDocuments,
  getCaseTimeline,
} from '../../services/case.service';
import { useAuthStore } from '../../store/auth.store';
import { Card, Badge, Spinner, EmptyState } from '../ui/index';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  formatDate,
  formatShortDate,
  getStatusColor,
  getPriorityColor,
  getCaseTypeColor,
  formatFileSize,
  getAccessLevelColor,
} from '../../utils/helpers';
import { CASE_STATUSES, CASE_PRIORITIES, CASE_TYPES, AUDIT_ACTIONS } from '../../utils/constants';
import type { Case, Document, AuditLog } from '../../types';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

// ─── Edit Modal ────────────────────────────────────────────────────────────────
const EditCaseModal: React.FC<{ caseData: Case; onClose: () => void }> = ({ caseData, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: caseData.title,
    description: caseData.description ?? '',
    status: caseData.status,
    priority: caseData.priority,
    location: caseData.location ?? '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => updateCase(caseData.id, data),
    onSuccess: () => {
      toast.success('Case updated');
      queryClient.invalidateQueries({ queryKey: ['case', caseData.id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update'),
  });

  return (
    <Modal isOpen onClose={onClose} title="Edit Case" size="md">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CASE_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as any }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CASE_PRIORITIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'documents' | 'timeline';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('documents');
  const [showEdit, setShowEdit] = useState(false);

  const { data: caseRes, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => getCaseById(id!),
    enabled: !!id,
  });

  const { data: docsRes } = useQuery({
    queryKey: ['case-documents', id],
    queryFn: () => getCaseDocuments(id!),
    enabled: !!id && tab === 'documents',
  });

  const { data: timelineRes } = useQuery({
    queryKey: ['case-timeline', id],
    queryFn: () => getCaseTimeline(id!),
    enabled: !!id && tab === 'timeline',
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCase(id!),
    onSuccess: () => {
      toast.success('Case deleted');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      navigate('/cases');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  });

  const caseData: Case | undefined = (caseRes as any)?.data;
  const docs: Document[] = (docsRes as any)?.data ?? [];
  const timeline: AuditLog[] = (timelineRes as any)?.data ?? [];

  const canEdit =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    caseData?.createdById === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <EmptyState
        title="Case not found"
        description="This case may have been deleted or you don't have access."
        action={<Button onClick={() => navigate('/cases')}>Back to Cases</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        to="/cases"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Cases
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm text-slate-500">{caseData.caseNumber}</span>
            <Badge className={getCaseTypeColor(caseData.type)}>
              {CASE_TYPES[caseData.type as keyof typeof CASE_TYPES]?.label ?? caseData.type}
            </Badge>
            <Badge className={getPriorityColor(caseData.priority)}>{caseData.priority}</Badge>
            <Badge className={getStatusColor(caseData.status)} dot>
              {CASE_STATUSES[caseData.status as keyof typeof CASE_STATUSES]?.label ?? caseData.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 truncate">{caseData.title}</h1>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowEdit(true)} className="flex items-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
            {ADMIN_ROLES.includes(user?.role ?? '') && (
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm('Delete this case? This cannot be undone.')) {
                    deleteMutation.mutate();
                  }
                }}
                isLoading={deleteMutation.isPending}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: User, label: 'Created By', value: (caseData as any).createdBy?.name ?? '—' },
          { icon: User, label: 'Assigned To', value: (caseData as any).assignedTo?.name ?? 'Unassigned' },
          { icon: Calendar, label: 'Created', value: formatShortDate(caseData.createdAt) },
          { icon: MapPin, label: 'Location', value: caseData.location ?? '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {caseData.description && (
        <Card>
          <p className="text-sm text-slate-600 leading-relaxed">{caseData.description}</p>
        </Card>
      )}

      {/* Tabs */}
      <div>
        <div className="border-b border-slate-200 flex gap-0">
          {(['documents', 'timeline'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'documents' && (
            <Card padding={false}>
              {docs.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10" />}
                  title="No documents"
                  description="Upload documents from the Documents page and link them to this case."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {docs.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.fileName} · {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                      <Badge className={getAccessLevelColor(doc.accessLevel)}>{doc.accessLevel}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === 'timeline' && (
            <Card padding={false}>
              {timeline.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-10 w-10" />}
                  title="No audit events"
                  description="Events will appear here when actions are taken on this case."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {timeline.map((log) => (
                    <div key={log.id} className="flex gap-4 px-5 py-3.5">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {AUDIT_ACTIONS[log.action] ?? log.action}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          by {log.userName} · {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {showEdit && caseData && (
        <EditCaseModal caseData={caseData} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};
