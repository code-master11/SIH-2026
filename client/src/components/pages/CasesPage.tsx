import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Search,
  ChevronRight,
  X,
} from 'lucide-react';
import { getCases, createCase } from '../../services/case.service';
import { useAuthStore } from '../../store/auth.store';
import {
  Card,
  Badge,
  Spinner,
  EmptyState,
  Pagination,
} from '../ui/index';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  formatShortDate,
  getStatusColor,
  getPriorityColor,
  getCaseTypeColor,
} from '../../utils/helpers';
import { CASE_STATUSES, CASE_PRIORITIES, CASE_TYPES } from '../../utils/constants';
import type { Case } from '../../types';
import toast from 'react-hot-toast';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR', 'OFFICER'];

const CreateCaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'FIR',
    priority: 'MEDIUM',
    location: '',
  });

  const mutation = useMutation({
    mutationFn: createCase,
    onSuccess: () => {
      toast.success('Case created successfully');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create case');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    mutation.mutate(form);
  };

  return (
    <Modal isOpen onClose={onClose} title="Create New Case" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Case Title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Brief title of the case"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Detailed description..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Case Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CASE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority *</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CASE_PRIORITIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="Crime scene / relevant location"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create Case</Button>
        </div>
      </form>
    </Modal>
  );
};

export const CasesPage: React.FC = () => {
  const { user } = useAuthStore();
  const canWrite = WRITE_ROLES.includes(user?.role ?? '');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cases', { page, search, filterStatus, filterPriority }],
    queryFn: () =>
      getCases({
        page,
        limit: 15,
        ...(search ? { search } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterPriority ? { priority: filterPriority } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const cases: Case[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <p className="text-sm text-slate-500">Manage and track all cases</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Case
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search cases..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(CASE_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            {Object.entries(CASE_PRIORITIES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {(filterStatus || filterPriority || search) && (
            <button
              onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setPage(1); }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-12 w-12" />}
            title="No cases found"
            description={search ? 'Try adjusting your search or filters.' : 'Create your first case to get started.'}
            action={
              canWrite ? (
                <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create Case
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Case #</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Priority</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Created</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{c.caseNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900 truncate max-w-xs">{c.title}</p>
                        {c.location && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{c.location}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={getCaseTypeColor(c.type)}>
                          {CASE_TYPES[c.type as keyof typeof CASE_TYPES]?.label ?? c.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={getStatusColor(c.status)} dot>
                          {CASE_STATUSES[c.status as keyof typeof CASE_STATUSES]?.label ?? c.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={getPriorityColor(c.priority)}>{c.priority}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatShortDate(c.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/cases/${c.id}`}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <div className="px-5 py-3 border-t border-slate-100">
                <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      {showCreate && <CreateCaseModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};
