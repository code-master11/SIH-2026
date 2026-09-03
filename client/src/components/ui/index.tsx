import React from 'react';
import { cn } from '../../utils/helpers';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, className, dot }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
      className
    )}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, header, footer, padding = true }) => (
  <div className={cn('rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden', className)}>
    {header && (
      <div className="border-b border-slate-200 px-5 py-4">{header}</div>
    )}
    <div className={padding ? 'p-5' : ''}>{children}</div>
    {footer && (
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50">{footer}</div>
    )}
  </div>
);

// ─── StatsCard ────────────────────────────────────────────────────────────────

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, iconBg = 'bg-indigo-100', trend, subtitle }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        {trend && (
          <p className={cn('mt-2 text-xs font-medium', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
      <div className={cn('rounded-xl p-3', iconBg)}>{icon}</div>
    </div>
  </Card>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600', sizes[size], className)}
    />
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-slate-300">{icon}</div>}
    <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
    {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── Skeleton ────────────────────────────────────────────────────────────────

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded bg-slate-200', className)} />
);

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  const getPages = () => {
    const result: (number | '...')[] = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
        result.push(i);
      } else if (result[result.length - 1] !== '...') {
        result.push('...');
      }
    }
    return result;
  };
  return (
    <nav className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              page === p
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </nav>
  );
};
