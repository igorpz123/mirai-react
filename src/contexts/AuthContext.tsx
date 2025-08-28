// src/contexts/AuthContext.tsx
import { createContext, useState } from "react"
import type { ReactNode } from "react"
import { loginRequest } from "../services/auth"
import type { AuthResponse, User } from "../services/auth"
import { jwtDecode } from "jwt-decode"

interface AuthContextData {
  token: string | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextData>({} as any)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1) lê token do localStorage
  const storedToken = localStorage.getItem("token")

  // 2) inicializa user decodificando o token, se existir
  const [token, setToken] = useState<string | null>(storedToken)
  const [user, setUser] = useState<User | null>(() => {
    if (!storedToken) return null
    try {
      const payload = jwtDecode<any>(storedToken)
      return {
        id:       payload.id,
        email:    payload.email,
        nome:     payload.nome,
        sobrenome: payload.sobrenome,
        cargoId:  payload.cargoId,
        cargo:    payload.cargo,
        fotoUrl:  payload.fotoUrl,
        unidades: payload.unidades  || [],
        setores:  payload.setores   || [],
      }
    } catch {
      return null
    }
  })

  // 3) ao logar, salvamos token e usuário vindos do backend
  const signIn = async (email: string, password: string) => {
    const { token: newToken, user: newUser }: AuthResponse =
      await loginRequest({ email, password })

    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const signOut = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}