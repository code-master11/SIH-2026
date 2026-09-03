import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen,
  FileText,
  Users,
  ClipboardList,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSystemStats } from '../../services/admin.service';
import { getCases } from '../../services/case.service';
import { verifyBlockchain } from '../../services/audit.service';
import { useAuthStore } from '../../store/auth.store';
import {
  StatsCard,
  Card,
  Badge,
  Spinner,
} from '../ui/index';
import {
  formatShortDate,
  getStatusColor,
  getPriorityColor,
} from '../../utils/helpers';
import { CASE_STATUSES, ROLES } from '../../utils/constants';
import type { Case } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getSystemStats,
    enabled: isAdmin,
  });

  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ['cases', { page: 1, limit: 5 }],
    queryFn: () => getCases({ page: 1, limit: 5 }),
  });

  const { data: chainData, isLoading: chainLoading, refetch: recheckChain } = useQuery({
    queryKey: ['blockchain-verify'],
    queryFn: verifyBlockchain,
    staleTime: 60_000,
  });

  const stats = statsData?.data;
  const recentCases: Case[] = (casesData as any)?.data ?? [];
  const chain = chainData?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome back, {user?.name} ·{' '}
          <span className="font-medium text-indigo-600">
            {ROLES[user?.role as keyof typeof ROLES]?.label ?? user?.role}
          </span>
        </p>
      </div>

      {/* Stats Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))
          ) : (
            <>
              <StatsCard
                label="Total Cases"
                value={stats?.totalCases ?? 0}
                icon={<FolderOpen className="h-5 w-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
              />
              <StatsCard
                label="Total Documents"
                value={stats?.totalDocuments ?? 0}
                icon={<FileText className="h-5 w-5 text-emerald-600" />}
                iconBg="bg-emerald-100"
              />
              <StatsCard
                label="Users"
                value={stats?.totalUsers ?? 0}
                icon={<Users className="h-5 w-5 text-purple-600" />}
                iconBg="bg-purple-100"
              />
              <StatsCard
                label="Audit Events"
                value={stats?.totalAuditLogs ?? 0}
                icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
                iconBg="bg-amber-100"
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <Card
            header={
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Recent Cases</h2>
                <Link to="/cases" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  View all →
                </Link>
              </div>
            }
            padding={false}
          >
            {casesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : recentCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FolderOpen className="h-10 w-10 mb-2" />
                <p className="text-sm">No cases yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCases.map((c) => (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.caseNumber} · {formatShortDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getPriorityColor(c.priority)}>{c.priority}</Badge>
                      <Badge className={getStatusColor(c.status)}>
                        {CASE_STATUSES[c.status]?.label ?? c.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Blockchain Status */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-800">Blockchain Integrity</h2>
              </div>
            }
          >
            {chainLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : !chain ? (
              <p className="text-xs text-slate-500 text-center py-4">Not verified yet</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {chain.isValid ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${chain.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                      {chain.isValid ? 'Chain Intact' : 'Chain Broken!'}
                    </p>
                    <p className="text-xs text-slate-500">{chain.totalBlocks} blocks verified</p>
                    {!chain.isValid && chain.brokenAt !== undefined && (
                      <p className="text-xs text-red-600 mt-0.5">Broken at block #{chain.brokenAt}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => recheckChain()}
                  className="w-full text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors"
                >
                  Re-verify now
                </button>
              </div>
            )}
          </Card>

          {/* Cases by Status */}
          {isAdmin && stats?.casesByStatus && (
            <Card
              header={
                <h2 className="text-sm font-semibold text-slate-800">Cases by Status</h2>
              }
            >
              <div className="space-y-2">
                {Object.entries(stats.casesByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge className={getStatusColor(status)} dot>
                      {CASE_STATUSES[status as keyof typeof CASE_STATUSES]?.label ?? status}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-700">{count as number}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
