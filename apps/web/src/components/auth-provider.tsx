"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RBACService } from '@/lib/auth-service';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; redirect?: string; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const currentUser = RBACService.getCurrentUser();
    if (currentUser && currentUser.role) {
      setUser(currentUser as AuthUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await RBACService.login(email, password);
    if (result.success) {
      refreshUser();
    }
    return { success: result.success, redirect: result.redirect, error: result.error };
  };

  const logout = () => {
    RBACService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
