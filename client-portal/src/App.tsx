import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ClientAuthProvider, useClientAuth } from './contexts/ClientAuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Proposals from './pages/Proposals'
import ProposalDetail from './pages/ProposalDetail'
import Documents from './pages/Documents'
import Profile from './pages/Profile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useClientAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return user ? <>{children}</> : null
}

function AppRoutes() {
  const { user } = useClientAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/propostas"
        element={
          <ProtectedRoute>
            <Proposals />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/propostas/:id"
        element={
          <ProtectedRoute>
            <ProposalDetail />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/documentos"
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ClientAuthProvider>
      <AppRoutes />
    </ClientAuthProvider>
  )
}

export default App
