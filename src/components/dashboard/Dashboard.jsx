import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MetricCard from '../components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboardAPI } from '../services/api';
import { 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  DollarSign,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    tarefasAndamento: 0,
    tarefasPendentes: 0,
    tarefasAtrasadas: 0,
    comissao: 0
  });
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch metrics
        const metricsData = await dashboardAPI.getMetrics();
        setMetrics(metricsData);
        
        // Fetch recommended tasks
        const tasksData = await dashboardAPI.getRecommendedTasks();
        setRecommendedTasks(tasksData);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Use fallback data in case of error
        setMetrics({
          tarefasAndamento: 5,
          tarefasPendentes: 12,
          tarefasAtrasadas: 3,
          comissao: 2450.75
        });
        
        setRecommendedTasks([
          {
            id: 1,
            empresa_nome: 'Empresa ABC',
            setor_nome: 'Vendas',
            prazo: '2024-01-15',
            status: 'progress'
          },
          {
            id: 2,
            empresa_nome: 'Empresa XYZ',
            setor_nome: 'Marketing',
            prazo: '2024-01-20',
            status: 'pendente'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'progress':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <h2 className="text-xl text-muted-foreground mt-2">
            Bem Vindo, {user?.nome || 'Usuário'}
          </h2>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tarefas em Andamento"
          value={metrics.tarefasAndamento}
          icon={Clock}
          color="blue"
        />
        <MetricCard
          title="Tarefas Pendentes"
          value={metrics.tarefasPendentes}
          icon={AlertCircle}
          color="yellow"
        />
        <MetricCard
          title="Tarefas Atrasadas"
          value={metrics.tarefasAtrasadas}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Comissão"
          value={formatCurrency(metrics.comissao)}
          icon={DollarSign}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico de Tarefas Concluídas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tarefas Concluídas</CardTitle>
              <select className="text-sm border rounded px-2 py-1">
                <option value="7">1 Semana</option>
                <option value="15">15 Dias</option>
                <option value="30">1 Mês</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Gráfico será implementado aqui
            </div>
          </CardContent>
        </Card>

        {/* Tarefas Recomendadas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tarefas Recomendadas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Tarefa
                </Button>
                <Button size="sm">
                  Visualizar Tarefas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Empresa</th>
                    <th className="text-left py-2 font-semibold">Setor</th>
                    <th className="text-left py-2 font-semibold">Prazo</th>
                    <th className="text-left py-2 font-semibold">Status</th>
                    <th className="text-left py-2 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendedTasks.map((task) => (
                    <tr key={task.id} className="border-b">
                      <td className="py-2 font-medium">{task.empresa_nome}</td>
                      <td className="py-2">{task.setor_nome}</td>
                      <td className="py-2">{formatDate(task.prazo)}</td>
                      <td className="py-2">{getStatusText(task.status)}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

