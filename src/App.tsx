import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { SidebarProvider, useSidebar, SidebarInset } from "@/components/ui/sidebar";
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

// Separa a lógica que utiliza o hook, garantindo que ela será renderizada
// dentro do SidebarProvider.
function AppContent() {
  const { open, isMobile } = useSidebar();

  // Se estiver em mobile ou se a sidebar estiver oculta, utiliza 93vw.
  // Se a sidebar estiver aberta no desktop, subtrai a largura da sidebar.
  const contentWidth =
    isMobile || !open ? "93vw" : "calc(98vw - var(--sidebar-width))";

  return (
    <SidebarInset style={{ width: contentWidth } as React.CSSProperties}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </Router>
    </SidebarInset>
  );
}

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;