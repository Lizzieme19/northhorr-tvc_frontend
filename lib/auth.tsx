'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

export type UserRole = 'STUDENT' | 'ADMIN' | 'DEPT_HEAD' | 'FINANCE' | 'STAFF' | 'PROCUREMENT' | 'HR';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  studentId?: string;
  admissionNo?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ntvc_access_token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem('ntvc_access_token');
          localStorage.removeItem('ntvc_refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ntvc_access_token', data.accessToken);
    localStorage.setItem('ntvc_refresh_token', data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('ntvc_refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    localStorage.removeItem('ntvc_access_token');
    localStorage.removeItem('ntvc_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const portalRoute = (role: UserRole) => {
  switch (role) {
    case 'ADMIN': return '/portal/admin';
    case 'DEPT_HEAD': return '/portal/dept-head';
    case 'FINANCE': return '/portal/finance';
    case 'STUDENT': return '/portal/student';
    case 'STAFF': return '/portal/staff';
    case 'PROCUREMENT': return '/portal/procurement';
    case 'HR': return '/portal/hr';
    default: return '/login';
  }
};
