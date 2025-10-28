// src/contexts/AuthContext.tsx
import { createContext, useState, useContext, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import { loginRequest } from "../services/auth"
import type { AuthResponse, User } from "../services/auth"
import { jwtDecode } from "jwt-decode"

interface AuthContextData {
  token: string | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  renewSession: () => Promise<boolean>
  sessionExpiring: boolean
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
        id:       payload.userId || payload.id, // backend assina como userId
        email:    payload.email,
        nome:     payload.nome,
        sobrenome: payload.sobrenome,
        cargoId:  payload.cargoId,
        cargo:    payload.cargo,
        fotoUrl:  payload.fotoUrl,
        unidades: payload.unidades  || [],
        setores:  payload.setores   || [],
        permissions: payload.permissions || [], // Novo: array de permissões
      }
    } catch {
      return null
    }
  })

  // 3) ao logar, salvamos token e usuário vindos do backend
  const signIn = async (email: string, password: string) => {
    const { token: newToken, user: newUser }: AuthResponse = await loginRequest({ email, password })

    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(newUser)

    // Ping imediato de presença (não bloquear fluxo de login)
    try {
      fetch('/api/presenca/ping', { method: 'POST', headers: { Authorization: 'Bearer ' + newToken } }).catch(() => {})
    } catch { /* ignore */ }
  }

  const [sessionExpiring, setSessionExpiring] = useState(false)
  const [renewing, setRenewing] = useState(false)

  const signOut = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    setSessionExpiring(false)
  }

  const renewSession = useCallback(async (): Promise<boolean> => {
    if (!token || renewing) return false
    setRenewing(true)
    try {
      const res = await fetch('/api/auth/renew', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      if (data?.token) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        setSessionExpiring(false)
        return true
      }
    } catch { /* ignore */ }
    finally { setRenewing(false) }
    return false
  }, [token, renewing])

  // Monitorar expiração local do token (decodificando exp)
  useEffect(() => {
    if (!token) return
    try {
      const payload: any = jwtDecode<any>(token)
      if (!payload?.exp) return
      const expMs = payload.exp * 1000
      const warnMs = 2 * 60 * 1000 // avisar 2 minutos antes
      const now = Date.now()
      if (expMs <= now) {
        // Token já expirou
        signOut()
        return
      }
      const warnTimeout = expMs - warnMs - now
      const expireTimeout = expMs - now
      let warnTimer: any, expireTimer: any
      if (warnTimeout > 0) {
        warnTimer = setTimeout(() => setSessionExpiring(true), warnTimeout)
      } else {
        setSessionExpiring(true)
      }
      expireTimer = setTimeout(() => {
        signOut()
      }, expireTimeout)
      return () => { clearTimeout(warnTimer); clearTimeout(expireTimer) }
    } catch { /* ignore */ }
  }, [token])


  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut, renewSession, sessionExpiring }}>
      {children}
      {sessionExpiring && token && user && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[1000]">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold">Sessão prestes a expirar</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Deseja continuar conectado?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={signOut} className="px-3 py-1.5 text-sm rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">Sair</button>
              <button disabled={renewing} onClick={() => renewSession()} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">{renewing ? 'Renovando...' : 'Continuar sessão'}</button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}