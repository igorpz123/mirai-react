import { useState, useEffect } from 'react';
import { 
  IconFile, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconUpload,
  IconCheck,
  IconX,
  IconFileText,
  IconSignature
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toastSuccess, toastError } from '@/lib/customToast';

// Helper para chamadas à API
const api = {
  get: async (url: string) => {
    const res = await fetch(`/api${url}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  post: async (url: string, data?: any) => {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: data ? JSON.stringify(data) : undefined
    });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  put: async (url: string, data?: any) => {
    const res = await fetch(`/api${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: data ? JSON.stringify(data) : undefined
    });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  },
  delete: async (url: string) => {
    const res = await fetch(`/api${url}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json() };
  }
};

interface DocumentTemplate {
  id: number;
  nome: string;
  descricao?: string;
  tipo: 'contrato' | 'proposta' | 'relatorio' | 'outro';
  formato: 'docx' | 'pdf';
  arquivo_template?: string;
  variaveis?: string[];
  ativo: boolean;
  requer_assinatura: boolean;
  tipo_assinatura: 'digital' | 'eletronica' | 'ambos';
  created_at: string;
}

export default function DocumentTemplates() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingTemplate, setUploadingTemplate] = useState<DocumentTemplate | null>(null);

  const [formData, setFormData] = useState<{
    nome: string;
    descricao: string;
    tipo: 'contrato' | 'proposta' | 'relatorio' | 'outro';
    formato: 'docx' | 'pdf';
    ativo: boolean;
    requer_assinatura: boolean;
    tipo_assinatura: 'digital' | 'eletronica' | 'ambos';
    variaveis: string[];
  }>({
    nome: '',
    descricao: '',
    tipo: 'contrato',
    formato: 'docx',
    ativo: true,
    requer_assinatura: false,
    tipo_assinatura: 'eletronica',
    variaveis: [],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documentos/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toastError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: DocumentTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nome: template.nome,
        descricao: template.descricao || '',
        tipo: template.tipo,
        formato: template.formato,
        ativo: template.ativo,
        requer_assinatura: template.requer_assinatura,
        tipo_assinatura: template.tipo_assinatura,
        variaveis: template.variaveis || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'contrato',
        formato: 'docx',
        ativo: true,
        requer_assinatura: false,
        tipo_assinatura: 'eletronica',
        variaveis: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await api.put(`/documentos/templates/${editingTemplate.id}`, formData);
        toastSuccess('Template atualizado com sucesso');
      } else {
        await api.post('/documentos/templates', formData);
        toastSuccess('Template criado com sucesso');
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toastError('Erro ao salvar template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await api.delete(`/documentos/templates/${id}`);
      toastSuccess('Template excluído com sucesso');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toastError('Erro ao excluir template');
    }
  };

  const handleUploadFile = async (template: DocumentTemplate) => {
    setUploadingTemplate(template);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadingTemplate) return;

    try {
      const formData = new FormData();
      formData.append('template', selectedFile);

      const res = await fetch(`/api/documentos/templates/${uploadingTemplate.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!res.ok) throw new Error(await res.text());

      toastSuccess('Arquivo de template enviado com sucesso');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toastError('Erro ao enviar arquivo de template');
    }
  };

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      contrato: 'Contrato',
      proposta: 'Proposta',
      relatorio: 'Relatório',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const getSignatureTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      digital: 'Digital',
      eletronica: 'Eletrônica',
      ambos: 'Digital e Eletrônica',
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return <div className="p-8">Carregando templates...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie templates para contratos, propostas e relatórios
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{template.nome}</CardTitle>
                </div>
                <div className="flex gap-1">
                  {template.ativo ? (
                    <Badge variant="default" className="bg-green-500">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <IconX className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>{template.descricao || 'Sem descrição'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{getTypeLabel(template.tipo)}</Badge>
                <Badge variant="outline">{template.formato.toUpperCase()}</Badge>
                {template.requer_assinatura && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconSignature className="h-3 w-3" />
                    {getSignatureTypeLabel(template.tipo_assinatura)}
                  </Badge>
                )}
              </div>

              {template.arquivo_template && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconFile className="h-4 w-4" />
                  <span className="truncate">{template.arquivo_template}</span>
                </div>
              )}

              {template.variaveis && template.variaveis.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Variáveis disponíveis:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {template.variaveis.slice(0, 3).map((v, i) => (
                      <code key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                        {`{{${v}}}`}
                      </code>
                    ))}
                    {template.variaveis.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{template.variaveis.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {!template.arquivo_template && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadFile(template)}
                    className="flex-1"
                  >
                    <IconUpload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(template)}
                  className="flex-1"
                >
                  <IconEdit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure o template de documento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="relatorio">Relatório</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formato">Formato *</Label>
                <Select value={formData.formato} onValueChange={(v: any) => setFormData({ ...formData, formato: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Template ativo</Label>
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requer_assinatura">Requer assinatura</Label>
                <p className="text-sm text-muted-foreground">
                  Documentos gerados exigirão assinatura
                </p>
              </div>
              <input
                type="checkbox"
                id="requer_assinatura"
                checked={formData.requer_assinatura}
                onChange={(e) => setFormData({ ...formData, requer_assinatura: e.target.checked })}
                className="h-4 w-4"
              />
            </div>

            {formData.requer_assinatura && (
              <div className="space-y-2">
                <Label htmlFor="tipo_assinatura">Tipo de Assinatura</Label>
                <Select
                  value={formData.tipo_assinatura}
                  onValueChange={(v: any) => setFormData({ ...formData, tipo_assinatura: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital (Certificado ICP-Brasil)</SelectItem>
                    <SelectItem value="eletronica">Eletrônica (Simples)</SelectItem>
                    <SelectItem value="ambos">Digital ou Eletrônica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Arquivo de Template</DialogTitle>
            <DialogDescription>
              Faça upload do arquivo DOCX com variáveis dinâmicas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Use variáveis no formato: {`{{empresa.nome}}, {{proposta.valor}}, etc.`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFileUpload} disabled={!selectedFile}>
              <IconUpload className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
