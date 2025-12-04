import { useState, useEffect } from 'react';
import { 
  IconFileText,
  IconDownload,
  IconSignature,
  IconEye,
  IconClock,
  IconCheck,
  IconX,
  IconFileOff
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toastError } from '@/lib/customToast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper para chamadas à API
const api = {
  get: async (url: string, options?: { params?: any; responseType?: string }) => {
    const queryString = options?.params ? '?' + new URLSearchParams(options.params).toString() : '';
    const res = await fetch(`/api${url}${queryString}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error(await res.text());
    if (options?.responseType === 'blob') {
      return { data: await res.blob() };
    }
    return { data: await res.json() };
  }
};

interface Document {
  id: number;
  nome: string;
  descricao?: string;
  tipo: string;
  formato: string;
  status: 'rascunho' | 'gerado' | 'assinado' | 'cancelado';
  versao_atual: number;
  requer_assinatura: boolean;
  total_assinaturas_requeridas: number;
  total_assinaturas_concluidas: number;
  entidade_tipo?: string;
  entidade_id?: number;
  generated_at: string;
}

interface Signature {
  id: number;
  user_id: number;
  tipo: 'digital' | 'eletronica';
  status: 'pendente' | 'assinado' | 'rejeitado' | 'expirado';
  nome?: string;
  sobrenome?: string;
  signed_at?: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);

  useEffect(() => {
    loadDocuments();
  }, [filterType, filterStatus]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType !== 'all') params.tipo = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await api.get('/documentos/documents', { params });
      setDocuments(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toastError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const loadSignatures = async (documentId: number) => {
    try {
      const response = await api.get(`/documentos/documents/${documentId}/signatures`);
      setSignatures(response.data);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      toastError('Erro ao carregar assinaturas');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await api.get(`/documentos/documents/${document.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.nome}.${document.formato}`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toastError('Erro ao fazer download do documento');
    }
  };

  const handleViewSignatures = async (document: Document) => {
    setSelectedDocument(document);
    await loadSignatures(document.id);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      rascunho: { variant: 'secondary', icon: IconFileOff, label: 'Rascunho' },
      gerado: { variant: 'default', icon: IconFileText, label: 'Gerado' },
      assinado: { variant: 'default', icon: IconCheck, label: 'Assinado' },
      cancelado: { variant: 'destructive', icon: IconX, label: 'Cancelado' },
    };
    
    const config = variants[status] || variants.gerado;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={status === 'assinado' ? 'bg-green-500' : ''}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getSignatureStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pendente: { variant: 'secondary', icon: IconClock, label: 'Pendente' },
      assinado: { variant: 'default', icon: IconCheck, label: 'Assinado' },
      rejeitado: { variant: 'destructive', icon: IconX, label: 'Rejeitado' },
      expirado: { variant: 'secondary', icon: IconClock, label: 'Expirado' },
    };
    
    const config = variants[status] || variants.pendente;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={status === 'assinado' ? 'bg-green-500' : ''}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-8">Carregando documentos...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie documentos gerados
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="contrato">Contratos</SelectItem>
            <SelectItem value="proposta">Propostas</SelectItem>
            <SelectItem value="relatorio">Relatórios</SelectItem>
            <SelectItem value="outro">Outros</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="gerado">Gerado</SelectItem>
            <SelectItem value="assinado">Assinado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <IconFileText className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{doc.nome}</CardTitle>
                    <CardDescription>
                      {doc.descricao || `Documento ${doc.tipo} - Versão ${doc.versao_atual}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  <Badge variant="outline">{doc.formato.toUpperCase()}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>
                    Gerado em: {format(new Date(doc.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {doc.requer_assinatura && (
                    <span className="flex items-center gap-1">
                      <IconSignature className="h-4 w-4" />
                      Assinaturas: {doc.total_assinaturas_concluidas}/{doc.total_assinaturas_requeridas}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {doc.requer_assinatura && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSignatures(doc)}
                    >
                      <IconEye className="h-4 w-4 mr-1" />
                      Ver Assinaturas
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <IconDownload className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum documento encontrado</p>
            <p className="text-sm text-muted-foreground">
              Gere documentos a partir de templates ou propostas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Assinaturas */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assinaturas - {selectedDocument.nome}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(null)}>
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {signatures.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma assinatura registrada
                </p>
              ) : (
                signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {sig.nome} {sig.sobrenome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sig.tipo === 'digital' ? 'Assinatura Digital' : 'Assinatura Eletrônica'}
                      </p>
                      {sig.signed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assinado em: {format(new Date(sig.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    {getSignatureStatusBadge(sig.status)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
