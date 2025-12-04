import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs/promises';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { PDFDocument } from 'pdf-lib';

// =============================================
// Tipos e Interfaces
// =============================================

export type DocumentType = 'contrato' | 'proposta' | 'relatorio' | 'outro';
export type DocumentFormat = 'docx' | 'pdf';
export type DocumentStatus = 'rascunho' | 'gerado' | 'assinado' | 'cancelado';
export type EntityType = 'proposta' | 'empresa' | 'tarefa' | 'usuario' | 'outro';
export type SignatureType = 'digital' | 'eletronica' | 'ambos';

export interface DocumentTemplate {
  id?: number;
  nome: string;
  descricao?: string;
  tipo: DocumentType;
  formato: DocumentFormat;
  arquivo_template?: string;
  variaveis?: string[];
  ativo?: boolean;
  requer_assinatura?: boolean;
  tipo_assinatura?: SignatureType;
  condicao_uso?: Record<string, any>;
  created_by?: number;
  updated_by?: number;
}

export interface Document {
  id?: number;
  template_id?: number;
  nome: string;
  descricao?: string;
  tipo: DocumentType;
  formato: DocumentFormat;
  arquivo_path: string;
  arquivo_size?: number;
  entidade_tipo?: EntityType;
  entidade_id?: number;
  variaveis_utilizadas?: Record<string, any>;
  status?: DocumentStatus;
  versao_atual?: number;
  requer_assinatura?: boolean;
  total_assinaturas_requeridas?: number;
  total_assinaturas_concluidas?: number;
  generated_by: number;
}

export interface DocumentVersion {
  id?: number;
  document_id: number;
  versao: number;
  arquivo_path: string;
  arquivo_size?: number;
  alteracoes?: string;
  created_by: number;
}

// =============================================
// Serviço de Documentos
// =============================================

class DocumentService {
  private uploadsDir = path.join(__dirname, '../uploads/documents');

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('[DocumentService] Erro ao criar diretório de uploads:', error);
    }
  }

  // =============================================
  // Templates
  // =============================================

  async createTemplate(template: DocumentTemplate): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO document_templates (
        nome, descricao, tipo, formato, arquivo_template, variaveis,
        ativo, requer_assinatura, tipo_assinatura, condicao_uso, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.nome,
        template.descricao || null,
        template.tipo,
        template.formato,
        template.arquivo_template || null,
        template.variaveis ? JSON.stringify(template.variaveis) : null,
        template.ativo ?? true,
        template.requer_assinatura ?? false,
        template.tipo_assinatura || 'eletronica',
        template.condicao_uso ? JSON.stringify(template.condicao_uso) : null,
        template.created_by || null,
      ]
    );
    return result.insertId;
  }

  async getTemplates(filters?: {
    tipo?: DocumentType;
    ativo?: boolean;
  }): Promise<DocumentTemplate[]> {
    let query = 'SELECT * FROM document_templates WHERE 1=1';
    const params: any[] = [];

    if (filters?.tipo) {
      query += ' AND tipo = ?';
      params.push(filters.tipo);
    }

    if (filters?.ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(filters.ativo);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => ({
      ...row,
      variaveis: row.variaveis ? JSON.parse(row.variaveis) : [],
      condicao_uso: row.condicao_uso ? JSON.parse(row.condicao_uso) : null,
    })) as DocumentTemplate[];
  }

  async getTemplateById(id: number): Promise<DocumentTemplate | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM document_templates WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      variaveis: row.variaveis ? JSON.parse(row.variaveis) : [],
      condicao_uso: row.condicao_uso ? JSON.parse(row.condicao_uso) : null,
    } as DocumentTemplate;
  }

  async updateTemplate(id: number, template: Partial<DocumentTemplate>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (template.nome) {
      fields.push('nome = ?');
      values.push(template.nome);
    }
    if (template.descricao !== undefined) {
      fields.push('descricao = ?');
      values.push(template.descricao);
    }
    if (template.tipo) {
      fields.push('tipo = ?');
      values.push(template.tipo);
    }
    if (template.formato) {
      fields.push('formato = ?');
      values.push(template.formato);
    }
    if (template.arquivo_template !== undefined) {
      fields.push('arquivo_template = ?');
      values.push(template.arquivo_template);
    }
    if (template.variaveis) {
      fields.push('variaveis = ?');
      values.push(JSON.stringify(template.variaveis));
    }
    if (template.ativo !== undefined) {
      fields.push('ativo = ?');
      values.push(template.ativo);
    }
    if (template.requer_assinatura !== undefined) {
      fields.push('requer_assinatura = ?');
      values.push(template.requer_assinatura);
    }
    if (template.tipo_assinatura) {
      fields.push('tipo_assinatura = ?');
      values.push(template.tipo_assinatura);
    }
    if (template.condicao_uso !== undefined) {
      fields.push('condicao_uso = ?');
      values.push(template.condicao_uso ? JSON.stringify(template.condicao_uso) : null);
    }
    if (template.updated_by) {
      fields.push('updated_by = ?');
      values.push(template.updated_by);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE document_templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM document_templates WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // =============================================
  // Geração de Documentos
  // =============================================

  /**
   * Gera documento a partir de template DOCX com variáveis
   */
  async generateDocumentFromTemplate(
    templateId: number,
    variables: Record<string, any>,
    documentData: Partial<Document>
  ): Promise<number> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    if (!template.arquivo_template) {
      throw new Error('Template não possui arquivo associado. Por favor, faça upload de um arquivo DOCX para este template.');
    }

    // Ler arquivo template
    const templatePath = path.join(this.uploadsDir, 'templates', template.arquivo_template);
    
    // Verificar se o arquivo existe
    try {
      await fs.access(templatePath);
    } catch (error) {
      throw new Error(`Arquivo de template não encontrado: ${template.arquivo_template}. Por favor, faça upload do arquivo novamente.`);
    }

    let content: Buffer;
    try {
      content = await fs.readFile(templatePath);
    } catch (error) {
      throw new Error(`Erro ao ler arquivo de template: ${(error as Error).message}`);
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: function(part: any) {
        // Retorna string vazia para variáveis não encontradas
        if (!part.module) {
          return '';
        }
        if (part.module === 'rawxml') {
          return '';
        }
        return '';
      },
    });

    // Preencher variáveis
    doc.setData(variables);

    try {
      doc.render();
    } catch (error: any) {
      console.error('[DocumentService] Erro ao renderizar template:', error);
      
      // Tratamento específico para erros do docxtemplater
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors.map((err: any) => {
          return `Erro na linha ${err.line || '?'}: ${err.message || 'Erro desconhecido'}`;
        }).join('; ');
        throw new Error(`Erro ao processar template: ${errorMessages}`);
      }
      
      throw new Error(`Erro ao processar template: ${error.message || 'Erro desconhecido'}`);
    }

    // Gerar arquivo
    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    const filename = `${Date.now()}_${documentData.nome?.replace(/[^a-z0-9]/gi, '_') || 'document'}.docx`;
    const filepath = path.join(this.uploadsDir, filename);
    await fs.writeFile(filepath, buf);

    // Salvar no banco
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO documents (
        template_id, nome, descricao, tipo, formato, arquivo_path, arquivo_size,
        entidade_tipo, entidade_id, variaveis_utilizadas, status,
        requer_assinatura, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        documentData.nome || template.nome,
        documentData.descricao || null,
        documentData.tipo || template.tipo,
        'docx',
        filename,
        buf.length,
        documentData.entidade_tipo || null,
        documentData.entidade_id || null,
        JSON.stringify(variables),
        'gerado',
        template.requer_assinatura || false,
        documentData.generated_by,
      ]
    );

    const documentId = result.insertId;

    // Criar versão inicial
    await this.createVersion(documentId, 1, filename, buf.length, 'Versão inicial', documentData.generated_by!);

    return documentId;
  }

  /**
   * Converte documento DOCX para PDF
   */
  async convertToPDF(documentId: number): Promise<string> {
    // Por enquanto, retorna mensagem de não implementado
    // Para conversão real, seria necessário usar LibreOffice via comando ou biblioteca específica
    throw new Error('Conversão para PDF será implementada em versão futura');
  }

  /**
   * Gera documento de proposta/contrato com base nos itens
   */
  async generateProposalDocument(
    propostaId: number,
    userId: number
  ): Promise<number> {
    // Buscar dados da proposta com TODOS os campos da empresa
    const [propostas] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, 
              e.razao_social, e.nome_fantasia, e.cnpj, 
              e.cidade
       FROM propostas p
       LEFT JOIN empresas e ON p.empresa_id = e.id
       WHERE p.id = ?`,
      [propostaId]
    );

    if (propostas.length === 0) {
      throw new Error('Proposta não encontrada');
    }

    const proposta = propostas[0];

    // Buscar itens da proposta
    const [cursos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM propostas_cursos WHERE proposta_id = ?',
      [propostaId]
    );
    const [quimicos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM propostas_quimicos WHERE proposta_id = ?',
      [propostaId]
    );
    const [produtos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM propostas_produtos WHERE proposta_id = ?',
      [propostaId]
    );
    const [programas] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM propostas_programas WHERE proposta_id = ?',
      [propostaId]
    );

    // Buscar responsável
    const [usuarios] = await pool.execute<RowDataPacket[]>(
      'SELECT nome, sobrenome, email FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (usuarios.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const usuario = usuarios[0];

    // Montar variáveis
    const variables = {
      empresa: {
        razao_social: proposta.razao_social || '',
        nome_fantasia: proposta.nome_fantasia || '',
        cnpj: proposta.cnpj || '',
        cidade: proposta.cidade || '',
      },
      proposta: {
        id: proposta.id,
        data: new Date(proposta.created_at).toLocaleDateString('pt-BR'),
        valor_total: 0,
        cursos: cursos,
        quimicos: quimicos,
        produtos: produtos,
        programas: programas,
        observacoes: proposta.observacoes || '',
      },
      responsavel: {
        nome_completo: `${usuario.nome} ${usuario.sobrenome}`,
        email: usuario.email,
        cpf: '',
      },
      data_atual: new Date().toLocaleDateString('pt-BR'),
      data_inicio_vigencia: new Date().toLocaleDateString('pt-BR'),
      data_fim_vigencia: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      contratante: {
        nome: usuario.nome + ' ' + usuario.sobrenome,
        cpf: '',
        cargo: '',
      }
    };

    // Log das variáveis para debug
    console.log('[DocumentService] Gerando documento com variáveis:', JSON.stringify(variables, null, 2));

    // Determinar tipo de documento: se tem programas, gera contrato, senão gera proposta
    const tipoDocumento = programas.length > 0 ? 'contrato' : 'proposta';
    const nomeDocumento = programas.length > 0 
      ? `Contrato_Prestacao_Servicos_${propostaId}` 
      : `Proposta_Comercial_${propostaId}`;

    // Buscar template apropriado
    const templates = await this.getTemplates({ tipo: tipoDocumento, ativo: true });
    if (templates.length === 0) {
      throw new Error(`Nenhum template de ${tipoDocumento} encontrado. Por favor, crie um template antes de gerar o documento.`);
    }

    return this.generateDocumentFromTemplate(templates[0].id!, variables, {
      nome: nomeDocumento,
      tipo: tipoDocumento,
      entidade_tipo: 'proposta',
      entidade_id: propostaId,
      generated_by: userId,
    });
  }

  // =============================================
  // Documentos
  // =============================================

  async getDocuments(filters?: {
    tipo?: DocumentType;
    status?: DocumentStatus;
    entidade_tipo?: EntityType;
    entidade_id?: number;
    generated_by?: number;
  }): Promise<Document[]> {
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params: any[] = [];

    if (filters?.tipo) {
      query += ' AND tipo = ?';
      params.push(filters.tipo);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.entidade_tipo) {
      query += ' AND entidade_tipo = ?';
      params.push(filters.entidade_tipo);
    }
    if (filters?.entidade_id) {
      query += ' AND entidade_id = ?';
      params.push(filters.entidade_id);
    }
    if (filters?.generated_by) {
      query += ' AND generated_by = ?';
      params.push(filters.generated_by);
    }

    query += ' ORDER BY generated_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => ({
      ...row,
      variaveis_utilizadas: row.variaveis_utilizadas ? JSON.parse(row.variaveis_utilizadas) : null,
    })) as Document[];
  }

  async getDocumentById(id: number): Promise<Document | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      variaveis_utilizadas: row.variaveis_utilizadas ? JSON.parse(row.variaveis_utilizadas) : null,
    } as Document;
  }

  async updateDocumentStatus(id: number, status: DocumentStatus): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE documents SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const document = await this.getDocumentById(id);
    if (!document) return false;

    // Deletar arquivo físico
    try {
      await fs.unlink(path.join(this.uploadsDir, document.arquivo_path));
    } catch (error) {
      console.error('[DocumentService] Erro ao deletar arquivo:', error);
    }

    // Deletar do banco
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM documents WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // =============================================
  // Versões
  // =============================================

  async createVersion(
    documentId: number,
    versao: number,
    arquivo_path: string,
    arquivo_size: number,
    alteracoes: string,
    created_by: number
  ): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO document_versions (
        document_id, versao, arquivo_path, arquivo_size, alteracoes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [documentId, versao, arquivo_path, arquivo_size, alteracoes, created_by]
    );

    // Atualizar versão atual do documento
    await pool.execute(
      'UPDATE documents SET versao_atual = ? WHERE id = ?',
      [versao, documentId]
    );

    return result.insertId;
  }

  async getVersions(documentId: number): Promise<DocumentVersion[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM document_versions WHERE document_id = ? ORDER BY versao DESC',
      [documentId]
    );
    return rows as DocumentVersion[];
  }

  // =============================================
  // Auditoria
  // =============================================

  async logAudit(
    documentId: number,
    userId: number,
    acao: string,
    descricao: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await pool.execute(
      `INSERT INTO document_audit_log (
        document_id, user_id, acao, descricao, metadata, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        documentId,
        userId,
        acao,
        descricao,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  }

  async getAuditLog(documentId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT dal.*, u.nome, u.sobrenome
       FROM document_audit_log dal
       LEFT JOIN usuarios u ON dal.user_id = u.id
       WHERE dal.document_id = ?
       ORDER BY dal.created_at DESC`,
      [documentId]
    );
    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }
}

export const documentService = new DocumentService();
