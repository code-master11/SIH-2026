import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/index';

// Pages
import { LoginPage } from './components/pages/LoginPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { CasesPage } from './components/pages/CasesPage';
import { CaseDetailPage } from './components/pages/CaseDetailPage';
import { DocumentsPage } from './components/pages/DocumentsPage';
import { DocumentDetailPage } from './components/pages/DocumentDetailPage';
import { SearchPage } from './components/pages/SearchPage';
import { AuditPage } from './components/pages/AuditPage';
import { AdminPage } from './components/pages/AdminPage';
import { ProfilePage } from './components/pages/ProfilePage';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { initializeAuth, isLoading } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected – all authenticated users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CasesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <DocumentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected – Admin/Auditor only */}
      <Route
        path="/audit"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'AUDITOR']}>
            <AuditPage />
          </ProtectedRoute>
        }
      />

      {/* Protected – Admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
