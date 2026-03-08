import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_refresh_token', refreshToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh_token');
    setUser(null);
  };

  const hasPermission = (module, action = 'read') => {
    if (!user?.role) return false;
    if (user.role.name === 'admin') return true;
    const perms = JSON.parse(user.role.permissions || '{}');
    return perms[module]?.includes(action) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
