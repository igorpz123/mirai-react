// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { loginRequest } from '../services/auth'
import type { AuthResponse, User } from '../services/auth'
import { jwtDecode } from 'jwt-decode'

interface AuthContextData {
  token: string | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (token) {
      try {
        // Decodifica o payload do JWT para obter as informações do usuário,
        // incluindo unidades e setores se presentes.
        const decoded = jwtDecode<User>(token);
        setUser({
          id: decoded.id,
          email: decoded.email,
          nome: decoded.nome,
          sobrenome: decoded.sobrenome,
          // Se o token não contiver unidades ou setores, coloca arrays vazios
          unidades: decoded.unidades || [],
          setores: decoded.setores || [],
          cargoId: decoded.cargoId,
          cargo: decoded.cargo,
          fotoUrl: decoded.fotoUrl,
        });
      } catch (err) {
        console.error('Falha ao decodificar token:', err)
        // token inválido? força logout
        setToken(null)
        localStorage.removeItem('token')
      }
    }
  }, [token])

  const signIn = async (email: string, password: string) => {
    const { token: newToken, user: newUser }: AuthResponse = await loginRequest({
      email,
      password
    })
    localStorage.setItem('token', newToken)
    setToken(newToken)
    // setUser(newUser)
  }

  const signOut = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        signIn,
        signOut,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}