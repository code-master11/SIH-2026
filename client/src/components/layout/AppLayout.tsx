import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, FileText, Search,
  ClipboardList, Settings, Bell, LogOut, Menu, X,
  Shield, ChevronRight, Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { generateInitials } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';
import { getNotifications, markAllAsRead } from '../../services/notification.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
  { to: '/cases',     label: 'Cases',     icon: FolderOpen,      roles: [] },
  { to: '/documents', label: 'Documents', icon: FileText,         roles: [] },
  { to: '/search',    label: 'Search',    icon: Search,           roles: [] },
  { to: '/audit',     label: 'Audit Log', icon: ClipboardList,    roles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'] },
  { to: '/admin',     label: 'Admin',     icon: Settings,         roles: ['SUPER_ADMIN', 'ADMIN'] },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ mobile?: boolean; onClose?: () => void }> = ({ mobile, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filtered = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.includes(user?.role ?? '')
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0f172a] to-[#1e1b4b]">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/50"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">SecureDMS</p>
            <p className="text-[10px] text-indigo-400 font-medium tracking-widest uppercase">ByteForce · SIH 2026</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {filtered.map((item, i) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <NavLink
                to={item.to}
                onClick={mobile ? onClose : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.label}
                {isActive && (
                  <motion.div
                    className="ml-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Zap className="h-3 w-3 text-indigo-400" />
                  </motion.div>
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/5 p-3 space-y-1">
        <NavLink
          to="/profile"
          onClick={mobile ? onClose : undefined}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors group"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md">
            {generateInitials(user?.name ?? 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-[10px] text-indigo-400">
              {ROLES[user?.role as keyof typeof ROLES]?.label ?? user?.role}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-12 z-50 w-80 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">
          Notifications {unread > 0 && (
            <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white font-bold">{unread}</span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={handleMarkAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
            >
              {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 float-right mt-1" />}
              <p className="text-sm font-medium text-slate-800">{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// ─── App Layout ───────────────────────────────────────────────────────────────
interface AppLayoutProps { children: React.ReactNode }

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

  useEffect(() => {
    if (!notifOpen) return;
    const handler = () => setNotifOpen(false);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [notifOpen]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col shadow-xl shadow-slate-900/10">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-50 flex h-full w-60 flex-col"
            >
              <Sidebar mobile onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearch} className="hidden md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search documents, cases..."
                  className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); setNotifOpen((o) => !o); }}
                className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <AnimatePresence>
                {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavLink
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md hover:shadow-indigo-300 transition-shadow"
              >
                {generateInitials(user?.name ?? 'U')}
              </NavLink>
            </motion.div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
