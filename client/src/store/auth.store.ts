import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { accessToken, refreshToken, user } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch {
          // ignore
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common.Authorization;
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        try {
          const res = await api.post('/auth/refresh-token', { refreshToken });
          const { accessToken } = res.data.data;
          localStorage.setItem('accessToken', accessToken);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          set({ accessToken });
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

      setLoading: (loading) => set({ isLoading: loading }),

      initializeAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        try {
          const res = await api.get('/auth/profile');
          set({ user: res.data.data, accessToken: token, isAuthenticated: true });
        } catch {
          await get().refreshAccessToken();
        }
      },
    }),
    {
      name: 'dms-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
