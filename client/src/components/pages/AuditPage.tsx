import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react';
import { getAuditLogs, verifyBlockchain, exportAudit } from '../../services/audit.service';
import { Card, Badge, Spinner, EmptyState, Pagination } from '../ui/index';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/helpers';
import { AUDIT_ACTIONS } from '../../utils/constants';
import type { AuditLog } from '../../types';
import toast from 'react-hot-toast';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGOUT: 'bg-slate-100 text-slate-600',
  UPLOAD_DOCUMENT: 'bg-emerald-100 text-emerald-800',
  DOWNLOAD_DOCUMENT: 'bg-teal-100 text-teal-800',
  VIEW_DOCUMENT: 'bg-sky-100 text-sky-800',
  DELETE_DOCUMENT: 'bg-red-100 text-red-800',
  SIGN_DOCUMENT: 'bg-purple-100 text-purple-800',
  CREATE_CASE: 'bg-indigo-100 text-indigo-800',
  UPDATE_CASE: 'bg-amber-100 text-amber-800',
  DELETE_CASE: 'bg-red-100 text-red-800',
};

export const AuditPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, filterAction }],
    queryFn: () => getAuditLogs({ page, limit: 20, ...(filterAction ? { action: filterAction } : {}) }),
    placeholderData: (prev) => prev,
  });

  const { data: chainData, isLoading: chainLoading, refetch: reverify } = useQuery({
    queryKey: ['blockchain-verify'],
    queryFn: verifyBlockchain,
    staleTime: 30_000,
  });

  const logs: AuditLog[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;
  const chain = chainData?.data;

  const handleExport = async () => {
    try {
      await exportAudit();
      toast.success('Audit log exported');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">Blockchain-backed tamper-proof activity log</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Export JSON
        </Button>
      </div>

      {/* Blockchain Status Card */}
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${chain?.isValid === false ? 'bg-red-100' : 'bg-emerald-100'}`}>
              <Shield className={`h-6 w-6 ${chain?.isValid === false ? 'text-red-500' : 'text-emerald-600'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Blockchain Integrity</p>
              {chainLoading ? (
                <p className="text-xs text-slate-400 mt-0.5">Verifying…</p>
              ) : chain ? (
                <div className="flex items-center gap-2 mt-0.5">
                  {chain.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <p className={`text-sm font-medium ${chain.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                    {chain.isValid ? 'All blocks intact' : `Chain broken at block #${chain.brokenAt}`}
                  </p>
                  <span className="text-xs text-slate-400">· {chain.totalBlocks} blocks</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Not yet verified</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => reverify()}
            variant="outline"
            className="flex items-center gap-2"
            isLoading={chainLoading}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-verify
          </Button>
        </div>
      </Card>

      {/* Filters + Table */}
      <Card padding={false}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            {Object.entries(AUDIT_ACTIONS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400 ml-auto">
            {pagination?.total ?? 0} total events
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-12 w-12" />}
            title="No audit logs"
            description="Activity events will appear here once users start using the system."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">User</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">IP</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Block #</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <Badge className={ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}>
                          {AUDIT_ACTIONS[log.action] ?? log.action}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-slate-700">{log.entityType}</p>
                        <p className="text-xs text-slate-400 font-mono truncate max-w-[120px]">{log.entityId}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-slate-700">{log.userName}</p>
                        <p className="text-xs text-slate-400">{log.userRole}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 font-mono">{log.ipAddress ?? '—'}</td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-500">#{log.blockIndex}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(log.createdAt)}</td>
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
    </div>
  );
};
