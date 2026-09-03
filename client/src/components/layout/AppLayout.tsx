import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Search,
  ClipboardList,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { generateInitials } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import { getNotifications, markAllAsRead } from '../../services/notification.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ─── Nav items definition ─────────────────────────────────────────────────────

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
  { to: '/cases', label: 'Cases', icon: FolderOpen, roles: [] },
  { to: '/documents', label: 'Documents', icon: FileText, roles: [] },
  { to: '/search', label: 'Search', icon: Search, roles: [] },
  { to: '/audit', label: 'Audit Log', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'] },
  { to: '/admin', label: 'Admin Panel', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC<{ mobile?: boolean; onClose?: () => void }> = ({ mobile, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filtered = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.includes(user?.role ?? '')
  );

  return (
    <div className="flex h-full flex-col bg-indigo-950 text-white">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-indigo-800">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-indigo-300" />
          <div>
            <p className="text-sm font-bold tracking-wide">SecureDMS</p>
            <p className="text-xs text-indigo-400">Document Management</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-indigo-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-700 text-white shadow-inner'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-indigo-800 p-4">
        <NavLink
          to="/profile"
          onClick={mobile ? onClose : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-indigo-800 transition-colors mb-1"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold">
            {generateInitials(user?.name ?? 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-indigo-400">
              {ROLES[user?.role as keyof typeof ROLES]?.label ?? user?.role}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-indigo-300 hover:bg-indigo-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

// ─── Notification Panel ───────────────────────────────────────────────────────

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  const notifications: Notification[] = data?.data ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const handleMarkAll = async () => {
    await markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.success('All notifications marked as read');
  };

  return (
    <div
      className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={handleMarkAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close notifications">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No notifications</p>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
            >
              <p className="text-sm font-medium text-slate-800">{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── App Layout ───────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });
  const unreadCount = (notifData?.data ?? []).filter((n: Notification) => !n.isRead).length;

  const [searchVal, setSearchVal] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  // Close notif panel on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = () => setNotifOpen(false);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [notifOpen]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-64 flex-col">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search documents, cases..."
                  className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setNotifOpen((o) => !o); }}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </div>

            {/* User avatar */}
            <NavLink
              to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              {generateInitials(user?.name ?? 'U')}
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
