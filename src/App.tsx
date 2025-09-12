import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UnitProvider } from './contexts/UnitContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { SidebarProvider, useSidebar, SidebarInset } from "@/components/ui/sidebar";
import Layout from './components/layout/Layout';
import Login from './pages/Login';
//Páginas do Setor Técnico
import TechnicalFluxogramaSetor from './pages/TechnicalFluxograma';
import TechnicalAgenda from './pages/TechnicalAgenda';
import TechnicalAgendaUser from './pages/TechnicalAgendaUser';
import NewTaskForm from './components/technical-task-new';
import TecnicoDashboard from '@/pages/TechnicalDashboard';
import TechnicalMap from '@/pages/TechnicalMap';
import TechnicalMapUser from './pages/TechnicalMapUser';
import TechnicalTaskDetail from './pages/TechnicalTaskDetail';

//Páginas do Setor Comercial
import ComercialDashboard from '@/pages/ComercialDashboard';

//Página de Administração
import AdminDashboard from './pages/AdminDashboard';
import './App.css';
import { useAuth } from './hooks/use-auth';

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
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="technical/dashboard" element={<TecnicoDashboard />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="comercial/dashboard" element={<ComercialDashboard />} />
            <Route path="technical/fluxograma/setor/:setorSlug" element={<TechnicalFluxogramaSetor />} />
            <Route path="technical/agenda" element={<TechnicalAgenda />} />
            <Route path="technical/agenda/:usuarioId" element={<TechnicalAgendaUser />} />
            <Route path="technical/mapa" element={<TechnicalMap />} />
            <Route path="technical/mapa/:usuarioId" element={<TechnicalMapUser />} />
            <Route path="technical/tarefa/:id" element={<TechnicalTaskDetail />} />
            <Route path="nova-tarefa" element={<NewTaskForm />} />
          </Route>
        </Routes>
      </Router>
    </SidebarInset>
  );
}

// Redireciona o usuário logado para a dashboard correta com base no cargoId.
function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const cargoId = user.cargoId;

  if (cargoId === 1 || cargoId === 2 || cargoId === 3) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (cargoId === 13) {
    return <Navigate to="/comercial/dashboard" replace />;
  }

  return <Navigate to="/technical/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <UnitProvider>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </UnitProvider>
    </AuthProvider>
  );
}

export default App;