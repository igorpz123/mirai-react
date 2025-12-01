import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconSearch, 
  IconDownload, 
  IconFilter, 
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconActivity,
  IconUser,
  IconFileText,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconCalendar,
} from '@tabler/icons-react';
import { toastSuccess, toastError } from '@/lib/customToast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================
// Tipos
// =============================================

interface AuditLog {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  changes: any;
  metadata: any;
  ip_address: string;
  user_agent: string;
  request_method: string;
  request_path: string;
  status: 'success' | 'failure' | 'error';
  error_message: string | null;
  created_at: string;
}

interface AuditStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByUser: Array<{ user_name: string; total: number }>;
  logsByDate: Array<{ date: string; total: number }>;
  successRate: number;
}

// =============================================
// Componente Principal
// =============================================

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<string>('all');
  const [entityType, setEntityType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // =============================================
  // Buscar Logs
  // =============================================

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (search) params.append('search', search);
      if (action !== 'all') params.append('action', action);
      if (entityType !== 'all') params.append('entityType', entityType);
      if (status !== 'all') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/auditoria?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar logs');

      const data = await response.json();
      setLogs(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toastError('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // Buscar Estatísticas
  // =============================================

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/auditoria/stats?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar estatísticas');

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // =============================================
  // Exportar para CSV
  // =============================================

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (action !== 'all') params.append('action', action);
      if (entityType !== 'all') params.append('entityType', entityType);
      if (status !== 'all') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/auditoria/export/csv?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao exportar logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toastSuccess('Logs exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      toastError('Erro ao exportar logs');
    } finally {
      setExporting(false);
    }
  };

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    fetchLogs();
  }, [page, action, entityType, status, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  // =============================================
  // Helpers
  // =============================================

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500',
      UPDATE: 'bg-blue-500',
      DELETE: 'bg-red-500',
      READ: 'bg-gray-500',
      LOGIN: 'bg-purple-500',
      LOGOUT: 'bg-purple-400',
      EXPORT: 'bg-orange-500',
      IMPORT: 'bg-orange-400',
    };
    return colors[action] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <IconCircleCheck className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <IconCircleX className="h-4 w-4 text-red-500" />;
    return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  // =============================================
  // Render
  // =============================================

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Rastreie todas as ações realizadas no sistema
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <IconDownload className="mr-2 h-4 w-4" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">
            <IconFileText className="mr-2 h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="stats">
            <IconActivity className="mr-2 h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* ============ ABA DE LOGS ============ */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconFilter className="mr-2 h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar em logs..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="CREATE">Criar</SelectItem>
                      <SelectItem value="UPDATE">Atualizar</SelectItem>
                      <SelectItem value="DELETE">Deletar</SelectItem>
                      <SelectItem value="READ">Visualizar</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="EXPORT">Exportar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="task">Tarefa</SelectItem>
                      <SelectItem value="proposal">Proposta</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="permission">Permissão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="failure">Falha</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <Button onClick={() => fetchLogs()} className="flex-1">
                    <IconSearch className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setAction('all');
                      setEntityType('all');
                      setStatus('all');
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                    }}
                  >
                    <IconRefresh className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Registros ({total} total)</CardTitle>
              <CardDescription>
                Página {page} de {totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{getStatusIcon(log.status)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center text-sm">
                                <IconCalendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span title={log.created_at}>
                                  {formatDistanceToNow(new Date(log.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <IconUser className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{log.user_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {log.user_email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionBadge(log.action)}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate" title={log.description}>
                                {log.description}
                              </div>
                              {log.entity_type && (
                                <div className="text-xs text-muted-foreground">
                                  {log.entity_type}
                                  {log.entity_id && ` #${log.entity_id}`}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.ip_address}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {(page - 1) * limit + 1} a{' '}
                      {Math.min(page * limit, total)} de {total} registros
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Próxima
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ ABA DE ESTATÍSTICAS ============ */}
        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalLogs.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Sucesso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {stats.successRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.logsByAction).map(([action, count]) => (
                      <div key={action} className="flex justify-between text-sm">
                        <span>{action}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.logsByUser.slice(0, 5).map((user) => (
                      <div key={user.user_name} className="flex justify-between text-sm">
                        <span className="truncate">{user.user_name}</span>
                        <Badge variant="outline">{user.total}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
