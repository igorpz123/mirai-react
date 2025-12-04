import { Request, Response } from 'express';
import { documentService } from '../services/documentService';
import { signatureService } from '../services/signatureService';
import path from 'path';
import fs from 'fs/promises';

// =============================================
// Templates
// =============================================

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { tipo, ativo } = req.query;
    
    const templates = await documentService.getTemplates({
      tipo: tipo as any,
      ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
    });

    res.json(templates);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar templates:', error);
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await documentService.getTemplateById(parseInt(id));

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json(template);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar template:', error);
    res.status(500).json({ error: 'Erro ao buscar template' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const templateData = {
      ...req.body,
      created_by: userId,
    };

    const templateId = await documentService.createTemplate(templateData);
    res.status(201).json({ id: templateId, message: 'Template criado com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao criar template:', error);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    const templateData = {
      ...req.body,
      updated_by: userId,
    };

    const success = await documentService.updateTemplate(parseInt(id), templateData);

    if (!success) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json({ message: 'Template atualizado com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao atualizar template:', error);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await documentService.deleteTemplate(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json({ message: 'Template excluído com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao excluir template:', error);
    res.status(500).json({ error: 'Erro ao excluir template' });
  }
};

export const uploadTemplateFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { id } = req.params;
    const userId = (req as any).userId;
    
    // Mover arquivo para pasta de templates
    const templatesDir = path.join(__dirname, '../uploads/documents/templates');
    await fs.mkdir(templatesDir, { recursive: true });
    
    const filename = `template_${id}_${Date.now()}_${req.file.originalname}`;
    const filepath = path.join(templatesDir, filename);
    await fs.rename(req.file.path, filepath);

    // Atualizar template
    await documentService.updateTemplate(parseInt(id), {
      arquivo_template: filename,
      updated_by: userId,
    });

    res.json({ 
      message: 'Arquivo de template enviado com sucesso',
      filename 
    });
  } catch (error) {
    console.error('[DocumentController] Erro ao enviar arquivo de template:', error);
    res.status(500).json({ error: 'Erro ao enviar arquivo de template' });
  }
};

// =============================================
// Documentos
// =============================================

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { tipo, status, entidade_tipo, entidade_id, generated_by } = req.query;

    const documents = await documentService.getDocuments({
      tipo: tipo as any,
      status: status as any,
      entidade_tipo: entidade_tipo as any,
      entidade_id: entidade_id ? parseInt(entidade_id as string) : undefined,
      generated_by: generated_by ? parseInt(generated_by as string) : undefined,
    });

    res.json(documents);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const document = await documentService.getDocumentById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Log de auditoria
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    await documentService.logAudit(
      document.id!,
      userId,
      'visualizacao',
      'Documento visualizado',
      undefined,
      ipAddress,
      userAgent
    );

    res.json(document);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar documento:', error);
    res.status(500).json({ error: 'Erro ao buscar documento' });
  }
};

export const generateDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { template_id, variables, document_data } = req.body;

    if (!template_id || !variables) {
      return res.status(400).json({ error: 'Template ID e variáveis são obrigatórios' });
    }

    const documentId = await documentService.generateDocumentFromTemplate(
      template_id,
      variables,
      {
        ...document_data,
        generated_by: userId,
      }
    );

    // Log de auditoria
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    await documentService.logAudit(
      documentId,
      userId,
      'criacao',
      'Documento gerado a partir de template',
      { template_id, variables },
      ipAddress,
      userAgent
    );

    res.status(201).json({ 
      id: documentId, 
      message: 'Documento gerado com sucesso' 
    });
  } catch (error) {
    console.error('[DocumentController] Erro ao gerar documento:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar documento',
      details: (error as Error).message 
    });
  }
};

export const generateProposalDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { proposta_id } = req.params;

    const documentId = await documentService.generateProposalDocument(
      parseInt(proposta_id),
      userId
    );

    res.status(201).json({ 
      id: documentId, 
      message: 'Documento de proposta gerado com sucesso' 
    });
  } catch (error) {
    console.error('[DocumentController] Erro ao gerar documento de proposta:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar documento de proposta',
      details: (error as Error).message 
    });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    const document = await documentService.getDocumentById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    const filepath = path.join(__dirname, '../uploads/documents', document.arquivo_path);
    
    // Log de auditoria
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    await documentService.logAudit(
      document.id!,
      userId,
      'download',
      'Documento baixado',
      undefined,
      ipAddress,
      userAgent
    );

    res.download(filepath, document.nome);
  } catch (error) {
    console.error('[DocumentController] Erro ao fazer download de documento:', error);
    res.status(500).json({ error: 'Erro ao fazer download de documento' });
  }
};

export const updateDocumentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).userId;

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const success = await documentService.updateDocumentStatus(parseInt(id), status);

    if (!success) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Log de auditoria
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    await documentService.logAudit(
      parseInt(id),
      userId,
      'edicao',
      `Status do documento alterado para ${status}`,
      { old_status: req.body.old_status, new_status: status },
      ipAddress,
      userAgent
    );

    res.json({ message: 'Status do documento atualizado com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao atualizar status do documento:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do documento' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await documentService.deleteDocument(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    res.json({ message: 'Documento excluído com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento' });
  }
};

// =============================================
// Versões
// =============================================

export const getDocumentVersions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const versions = await documentService.getVersions(parseInt(id));
    res.json(versions);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar versões do documento:', error);
    res.status(500).json({ error: 'Erro ao buscar versões do documento' });
  }
};

// =============================================
// Assinaturas
// =============================================

export const getDocumentSignatures = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const signatures = await signatureService.getDocumentSignatures(parseInt(id));
    res.json(signatures);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar assinaturas:', error);
    res.status(500).json({ error: 'Erro ao buscar assinaturas' });
  }
};

export const createSignatureRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, tipo, expires_in_days, ordem } = req.body;

    if (!user_id || !tipo) {
      return res.status(400).json({ error: 'user_id e tipo são obrigatórios' });
    }

    if (tipo === 'eletronica') {
      const token = await signatureService.createElectronicSignatureRequest(
        parseInt(id),
        user_id,
        expires_in_days || 7,
        ordem
      );
      res.status(201).json({ 
        message: 'Solicitação de assinatura criada com sucesso',
        token 
      });
    } else {
      // Para assinatura digital, apenas criar registro pendente
      res.status(201).json({ 
        message: 'Solicitação de assinatura digital criada. Aguardando upload de certificado.' 
      });
    }
  } catch (error) {
    console.error('[DocumentController] Erro ao criar solicitação de assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar solicitação de assinatura' });
  }
};

export const signDocumentDigitally = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { password, motivo, observacoes } = req.body;

    if (!req.files || !(req.files as any).certificate || !(req.files as any).privateKey) {
      return res.status(400).json({ error: 'Certificado e chave privada são obrigatórios' });
    }

    const certificateFile = (req.files as any).certificate[0];
    const privateKeyFile = (req.files as any).privateKey[0];

    const certificateBuffer = await fs.readFile(certificateFile.path);
    const privateKeyBuffer = await fs.readFile(privateKeyFile.path);

    // Limpar arquivos temporários
    await fs.unlink(certificateFile.path);
    await fs.unlink(privateKeyFile.path);

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const signatureId = await signatureService.signDocumentDigitally(
      parseInt(id),
      userId,
      certificateBuffer,
      privateKeyBuffer,
      password,
      {
        motivo,
        observacoes,
        ip_address: ipAddress,
        user_agent: userAgent,
      }
    );

    // Log de auditoria
    await documentService.logAudit(
      parseInt(id),
      userId,
      'assinatura',
      'Documento assinado digitalmente',
      { signature_id: signatureId, tipo: 'digital' },
      ipAddress,
      userAgent
    );

    res.json({ 
      message: 'Documento assinado digitalmente com sucesso',
      signature_id: signatureId 
    });
  } catch (error) {
    console.error('[DocumentController] Erro ao assinar documento digitalmente:', error);
    res.status(500).json({ 
      error: 'Erro ao assinar documento digitalmente',
      details: (error as Error).message 
    });
  }
};

export const signDocumentElectronically = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { motivo, observacoes, geolocalizacao } = req.body;

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    await signatureService.signDocumentElectronically(token, {
      ip_address: ipAddress,
      user_agent: userAgent,
      geolocalizacao,
      motivo,
      observacoes,
    });

    res.json({ message: 'Documento assinado eletronicamente com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao assinar documento eletronicamente:', error);
    res.status(500).json({ 
      error: 'Erro ao assinar documento eletronicamente',
      details: (error as Error).message 
    });
  }
};

export const rejectSignature = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
    }

    await signatureService.rejectSignature(token, motivo);
    res.json({ message: 'Assinatura rejeitada com sucesso' });
  } catch (error) {
    console.error('[DocumentController] Erro ao rejeitar assinatura:', error);
    res.status(500).json({ error: 'Erro ao rejeitar assinatura' });
  }
};

export const verifyDigitalSignature = async (req: Request, res: Response) => {
  try {
    const { signature_id } = req.params;
    const isValid = await signatureService.verifyDigitalSignature(parseInt(signature_id));
    
    res.json({ 
      valid: isValid,
      message: isValid ? 'Assinatura válida' : 'Assinatura inválida'
    });
  } catch (error) {
    console.error('[DocumentController] Erro ao verificar assinatura:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar assinatura',
      details: (error as Error).message 
    });
  }
};

export const getPendingSignatures = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const signatures = await signatureService.getPendingSignatures(userId);
    res.json(signatures);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar assinaturas pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar assinaturas pendentes' });
  }
};

// =============================================
// Auditoria
// =============================================

export const getDocumentAuditLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await documentService.getAuditLog(parseInt(id));
    res.json(logs);
  } catch (error) {
    console.error('[DocumentController] Erro ao buscar log de auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar log de auditoria' });
  }
};
