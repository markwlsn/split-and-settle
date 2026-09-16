import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedToken && savedUser) {
      try {
        // Validate JWT expiration
        const parts = savedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
          }
        }
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  };

  const register = async (email, password, name, phone, username, metadata) => {
    const res = await api.register(email, password, name, phone, username, metadata);
    if (res.accessToken) {
      setToken(res.accessToken);
      setUser(res.user);
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const logoutAll = async () => {
    try {
      await api.logoutAll();
    } catch (e) {
      console.warn('Logout all error:', e);
    }
    logout();
  };

  const isAdmin =
    user?.user_metadata?.role === 'admin' ||
    user?.app_metadata?.role === 'admin' ||
    user?.email?.toLowerCase() === 'markwilsongeronilla01@gmail.com';

  const toggleAdminRole = () => {
    if (!user) return;
    const currentRole = user?.user_metadata?.role;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const updated = {
      ...user,
      user_metadata: {
        ...(user.user_metadata || {}),
        role: newRole,
      },
    };
    updateUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isAdmin,
        toggleAdminRole,
        login,
        register,
        updateUser,
        logout,
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
