import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderOpen, FileText, Users, Shield, Activity,
  TrendingUp, CheckCircle, XCircle, RefreshCw, ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCaseStats } from '../../services/case.service';
import { verifyBlockchain } from '../../services/audit.service';
import { useAuthStore } from '../../store/auth.store';
import { formatRelativeTime, getStatusColor, getPriorityColor } from '../../utils/helpers';
import { CASE_STATUSES } from '../../utils/constants';

import { AnimatedCounter, FadeIn } from '../ui/Animated';
import { getCases } from '../../services/case.service';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, bg, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, type: 'spring', stiffness: 240, damping: 22 }}
    whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.10)' }}
    className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 cursor-default"
  >
    {/* Background accent */}
    <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${bg} opacity-20`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-2 text-3xl font-bold ${color}`}>
          <AnimatedCounter to={value} />
        </p>
      </div>
      <div className={`rounded-xl p-2.5 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </div>
    {/* Bottom shimmer line */}
    <motion.div
      className={`absolute bottom-0 left-0 h-0.5 ${bg.replace('/10', '/60').replace('bg-', 'bg-')}`}
      initial={{ width: 0 }}
      animate={{ width: '100%' }}
      transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
    />
  </motion.div>
);

// ─── Blockchain Status ─────────────────────────────────────────────────────────
const BlockchainStatus: React.FC = () => {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['blockchain-verify'],
    queryFn: verifyBlockchain,
    refetchInterval: 60000,
  });
  const result = data?.data;
  const isValid = result?.isValid;
  const totalBlocks = result?.totalBlocks ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className={`rounded-2xl border-2 p-5 ${isValid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={isValid ? { scale: [1, 1.1, 1] } : { rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isValid
              ? <CheckCircle className="h-5 w-5 text-emerald-600" />
              : <XCircle className="h-5 w-5 text-red-600" />}
          </motion.div>
          <h3 className="text-sm font-semibold text-slate-800">Blockchain Integrity</h3>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
        >
          <motion.div animate={isFetching ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RefreshCw className="h-4 w-4" />
          </motion.div>
        </button>
      </div>

      {/* Block chain visualization */}
      <div className="flex items-center gap-1 flex-wrap mb-4">
        {Array.from({ length: Math.min(totalBlocks, 12) }).map((_, i) => (
          <React.Fragment key={i}>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
              className={`h-7 w-7 rounded-md text-xs font-bold flex items-center justify-center text-white shadow ${
                isValid ? 'bg-emerald-500' : i === 0 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            >
              {i + 1}
            </motion.div>
            {i < Math.min(totalBlocks, 12) - 1 && (
              <div className={`h-0.5 w-3 ${isValid ? 'bg-emerald-300' : i === 0 ? 'bg-red-300' : 'bg-emerald-300'}`} />
            )}
          </React.Fragment>
        ))}
        {totalBlocks > 12 && (
          <span className="text-xs text-slate-500 ml-1">+{totalBlocks - 12} more</span>
        )}
      </div>

      <div className={`rounded-lg p-3 ${isValid ? 'bg-emerald-100' : 'bg-red-100'}`}>
        <p className={`text-xs font-semibold ${isValid ? 'text-emerald-800' : 'text-red-800'}`}>
          {isValid
            ? `✓ Chain Intact — ${totalBlocks} blocks verified`
            : `✗ Chain Broken — ${result?.brokenAt ? `at block #${result.brokenAt}` : ''}`}
        </p>
        <p className={`text-xs mt-0.5 ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
          {isValid ? 'All audit records are tamper-proof' : 'Evidence tampering detected!'}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Recent Cases ──────────────────────────────────────────────────────────────
const RecentCases: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['cases', { page: 1, limit: 5 }],
    queryFn: () => getCases({ page: 1, limit: 5 }),
  });
  const cases = data?.data ?? [];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          Recent Cases
        </h3>
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {cases.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No cases yet</p>
        ) : (
          cases.map((c: any, i: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {c.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{c.caseNumber} · {formatRelativeTime(c.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityColor(c.priority)}`}>
                  {c.priority}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(c.status)}`}>
                  {CASE_STATUSES[c.status as keyof typeof CASE_STATUSES]?.label ?? c.status}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: statsData } = useQuery({
    queryKey: ['case-stats'],
    queryFn: getCaseStats,
  });
  const stats = statsData?.data;

  const statCards = [
    { label: 'Total Cases',     value: stats?.totalCases ?? 0,     icon: FolderOpen, color: 'text-indigo-600', bg: 'bg-indigo-100', delay: 0.1 },
    { label: 'Total Documents', value: stats?.totalDocuments ?? 0,  icon: FileText,   color: 'text-violet-600', bg: 'bg-violet-100', delay: 0.15 },
    { label: 'Users',           value: stats?.totalUsers ?? 0,      icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-100',   delay: 0.2 },
    { label: 'Audit Events',    value: stats?.totalAuditLogs ?? 0,  icon: Shield,     color: 'text-amber-600',  bg: 'bg-amber-100',  delay: 0.25 },
  ];

  const statusEntries = Object.entries(stats?.casesByStatus ?? {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Welcome back,{' '}
              <span className="font-semibold text-indigo-600">{user?.name}</span>
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">System Online</span>
          </motion.div>
        </div>
      </FadeIn>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Cases — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <RecentCases />

          {/* Cases by Status */}
          {statusEntries.length > 0 && (
            <FadeIn delay={0.3} className="rounded-2xl border border-slate-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                Cases by Status
              </h3>
              <div className="space-y-2.5">
                {statusEntries.map(([status, count]: any, i) => {
                  const total = statusEntries.reduce((a: number, [, v]: any) => a + v, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">
                          {CASE_STATUSES[status as keyof typeof CASE_STATUSES]?.label ?? status}
                        </span>
                        <span className="text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getStatusColor(status).replace('text-', 'bg-').replace('-800', '-500').replace('-700', '-400')}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </FadeIn>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-4">
          <BlockchainStatus />
        </div>
      </div>
    </div>
  );
};
