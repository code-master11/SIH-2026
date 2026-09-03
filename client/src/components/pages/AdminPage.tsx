import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, UserX, UserCheck, Edit2, X } from 'lucide-react';
import { getUsers, createUser, updateUser, suspendUser } from '../../services/admin.service';
import { getSystemStats } from '../../services/admin.service';
import { Card, Badge, Spinner, EmptyState, Pagination, StatsCard } from '../ui/index';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatShortDate, getRoleColor } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import type { User } from '../../types';
import toast from 'react-hot-toast';

// ─── Create User Modal ─────────────────────────────────────────────────────────
const CreateUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'OFFICER', department: '', badgeNumber: '',
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create user'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Name, email and password are required');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Modal isOpen onClose={onClose} title="Create New User" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="officer@police.gov" />
        </div>
        <Input label="Password *" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <Input label="Badge Number" value={form.badgeNumber} onChange={(e) => setForm(f => ({ ...f, badgeNumber: e.target.value }))} placeholder="P-12345" />
        </div>
        <Input label="Department" value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Cyber Crime, Homicide…" />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Edit Role Modal ────────────────────────────────────────────────────────────
const EditRoleModal: React.FC<{ user: User; onClose: () => void }> = ({ user: u, onClose }) => {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(u.role);
  const [department, setDepartment] = useState(u.department ?? '');

  const mutation = useMutation({
    mutationFn: () => updateUser(u.id, { role, department } as any),
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update'),
  });

  return (
    <Modal isOpen onClose={onClose} title={`Edit – ${u.name}`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Admin Page ────────────────────────────────────────────────────────────────
export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, search }],
    queryFn: () => getUsers({ page, limit: 15, ...(search ? { search } : {}) }),
    placeholderData: (prev) => prev,
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getSystemStats,
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendUser(id),
    onSuccess: (res) => {
      const active = (res as any).data?.isActive;
      toast.success(`User ${active ? 'activated' : 'suspended'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Action failed'),
  });

  const users: User[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;
  const stats = statsData?.data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500">Manage users, roles, and system settings</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New User
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard label="Total Users" value={stats.totalUsers} icon={<Users className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-100" />
          {Object.entries(stats.usersByRole ?? {}).slice(0, 3).map(([role, count]) => (
            <div key={role} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{ROLES[role as keyof typeof ROLES]?.label ?? role}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{count as number}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <Card padding={false}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users…"
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No users found"
            action={<Button onClick={() => setShowCreate(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Create User</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Name', 'Email', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={getRoleColor(u.role)}>
                          {ROLES[u.role as keyof typeof ROLES]?.label ?? u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{u.department ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} dot>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatShortDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit role"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`${u.isActive ? 'Suspend' : 'Activate'} ${u.name}?`)) {
                                suspendMutation.mutate(u.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.isActive ? 'Suspend user' : 'Activate user'}
                          >
                            {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                        </div>
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

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editUser && <EditRoleModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
};
