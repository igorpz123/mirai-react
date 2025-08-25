import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type {
  ReactNode,
  Dispatch,
  SetStateAction,
  FC
} from 'react';
import { authAPI } from '../services/api';

// Estrutura do usuário
interface User {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

// Resposta da API no login
interface LoginResponse {
  token: string;
  user: User;
}

// Formato de retorno das ações de login
interface LoginResult {
  success: boolean;
  error?: string;
}

// Tipagem do contexto
interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginDemo: () => LoginResult;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  setToken: Dispatch<SetStateAction<string | null>>;
}

// Cria o contexto já tipado
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Hook de consumo do contexto
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Props do provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Verifica autenticação ao montar/com alteração de token
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      if (token) {
        if (token.startsWith('demo-token-')) {
          setUser({
            id: 1,
            nome: 'Usuário Demo',
            email: 'demo@mirai.com',
            tipo: 'admin'
          });
        } else {
          try {
            const userData: User = await authAPI.me();
            setUser(userData);
          } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            logout();
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Função de login real
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response: LoginResponse = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      return { success: true };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login'
      };
    }
  };

  // Login demo (mock)
  const loginDemo = (): LoginResult => {
    const mockUser: User = {
      id: 1,
      nome: 'Usuário Demo',
      email: 'demo@mirai.com',
      tipo: 'admin'
    };
    const mockToken = 'demo-token-' + Date.now();
    setToken(mockToken);
    setUser(mockUser);
    localStorage.setItem('token', mockToken);
    return { success: true };
  };

  // Logout
  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value: AuthContextData = {
    user,
    token,
    loading,
    login,
    loginDemo,
    logout,
    isAuthenticated: !!user,
    setUser,
    setToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};