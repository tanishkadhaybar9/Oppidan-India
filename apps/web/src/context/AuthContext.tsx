import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import type { SafeUser, LoginPayload, RegisterPayload } from "../types/auth";

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing session on application initial load
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await authService.refresh();
      setUser(session.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (payload: LoginPayload) => {
    const session = await authService.login(payload);
    setUser(session.user);
  };

  const register = async (payload: RegisterPayload) => {
    const session = await authService.register(payload);
    setUser(session.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
