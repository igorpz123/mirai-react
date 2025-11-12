import React, { createContext, useContext, useState, useEffect } from 'react'

interface ClientUser {
  id: number
  empresa_id: number
  empresa_nome: string
  empresa_cnpj: string
  email: string
  nome: string
  telefone?: string
}

interface ClientAuthContextType {
  user: ClientUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined)

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const token = localStorage.getItem('client_token')
      if (token) {
        try {
          const response = await fetch('/api/client-portal/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          if (response.ok) {
            const data = await response.json()
            setUser(data)
          } else {
            localStorage.removeItem('client_token')
          }
        } catch (error) {
          console.error('Session check failed:', error)
          localStorage.removeItem('client_token')
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/client-portal/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()
    localStorage.setItem('client_token', data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('client_token')
    setUser(null)
  }

  return (
    <ClientAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext)
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider')
  }
  return context
}
