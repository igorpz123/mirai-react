import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AdminRoute, AdminOrSelfRoute } from './components/auth/AdminRoute';
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
import CommercialProposalDetail from '@/pages/CommercialProposalDetail';
import CommercialProposalNew from '@/pages/CommercialProposalNew';
import CommercialItemsPage from '@/pages/CommercialItems';

//Página de Administração
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUsersDetails from './pages/AdminUsersDetails';
import AdminUnidades from './pages/AdminUnidades';
import AdminSetores from './pages/AdminSetores';
import Empresas from './pages/Empresas';
import EmpresaDetails from './pages/EmpresaDetails';
import LivroRegistrosPage from './pages/LivroRegistros';
import './App.css';
import { useAuth } from './hooks/use-auth';

// Separa a lógica que utiliza o hook, garantindo que ela será renderizada
// dentro do SidebarProvider.
function AppContent() {
  return (
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
          <Route path="admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="admin/usuarios" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="admin/usuario/:id" element={<AdminOrSelfRoute><AdminUsersDetails /></AdminOrSelfRoute>} />
          <Route path="admin/unidades" element={<AdminRoute><AdminUnidades /></AdminRoute>} />
          <Route path="admin/setores" element={<AdminRoute><AdminSetores /></AdminRoute>} />
          <Route path="comercial/dashboard" element={<ComercialDashboard />} />
          <Route path="comercial/proposta/nova" element={<CommercialProposalNew />} />
          <Route path="comercial/proposta/:id" element={<CommercialProposalDetail />} />
          <Route path="comercial/items" element={<CommercialItemsPage />} />
          <Route path="technical/fluxograma/setor/:setorSlug" element={<TechnicalFluxogramaSetor />} />
          <Route path="technical/agenda" element={<TechnicalAgenda />} />
          <Route path="technical/agenda/:usuarioId" element={<TechnicalAgendaUser />} />
          <Route path="technical/mapa" element={<TechnicalMap />} />
          <Route path="technical/mapa/:usuarioId" element={<TechnicalMapUser />} />
          <Route path="technical/tarefa/:id" element={<TechnicalTaskDetail />} />
          <Route path="nova-tarefa" element={<NewTaskForm />} />
          <Route path="empresas" element={<Empresas />} />
          <Route path="empresa/:id" element={<EmpresaDetails />} />
          <Route path="comercial/livro-de-registros" element={<LivroRegistrosPage />} />
        </Route>
      </Routes>
    </Router>
  )
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

// App agora não recria Providers já existentes em main.tsx
function App() { return <AppContent /> }

export default App;