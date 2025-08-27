import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import { loginRequest } from '../services/auth';

interface AuthContextData {
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const signIn = async (email: string, password: string) => {
    const { token } = await loginRequest({ email, password });
    localStorage.setItem('token', token);
    setToken(token);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, signIn, signOut, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};