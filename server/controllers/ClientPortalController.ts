import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import { RowDataPacket } from 'mysql2';
// OneDrive removido - implementar sistema de arquivos local se necessário

interface ClientUser {
  id: number;
  empresa_id: number;
  empresa_nome: string;
  empresa_nome_fantasia: string;
  empresa_cnpj: string;
  email: string;
  nome: string;
  telefone: string | null;
}

// Funções auxiliares
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getCategoryFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'Documentos';
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'Planilhas';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'Imagens';
  if (['zip', 'rar', '7z'].includes(ext || '')) return 'Arquivos';
  
  return 'Outros';
}

// Login de cliente
export const login = async (req: Request, res: Response) => {
  try {
    console.log('[Client Portal Login] Tentativa de login:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[Client Portal Login] Erro: Campos obrigatórios faltando');
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    // Buscar usuário cliente
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        cu.id,
        cu.empresa_id,
        cu.email,
        cu.nome,
        cu.telefone,
        cu.password_hash,
        e.razao_social as empresa_nome,
        e.nome_fantasia as empresa_nome_fantasia,
        e.cnpj as empresa_cnpj
      FROM client_users cu
      JOIN empresas e ON cu.empresa_id = e.id
      WHERE cu.email = ?`,
      [email]
    );

    console.log('[Client Portal Login] Usuários encontrados:', rows.length);

    if (rows.length === 0) {
      console.log('[Client Portal Login] Erro: Usuário não encontrado');
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('[Client Portal Login] Erro: Senha inválida');
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        empresa_id: user.empresa_id,
        type: 'client', // Identificador para diferenciar de usuários internos
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar dados do usuário (sem senha)
    const clientData: ClientUser = {
      id: user.id,
      empresa_id: user.empresa_id,
      empresa_nome: user.empresa_nome,
      empresa_nome_fantasia: user.empresa_nome_fantasia,
      empresa_cnpj: user.empresa_cnpj,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
    };

    res.json({
      token,
      user: clientData,
    });
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// Obter usuário atual
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'client') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // Buscar dados atualizados do usuário
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        cu.id,
        cu.empresa_id,
        cu.email,
        cu.nome,
        cu.telefone,
        e.razao_social as empresa_nome,
        e.nome_fantasia as empresa_nome_fantasia,
        e.cnpj as empresa_cnpj
      FROM client_users cu
      JOIN empresas e ON cu.empresa_id = e.id
      WHERE cu.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];

    const clientData: ClientUser = {
      id: user.id,
      empresa_id: user.empresa_id,
      empresa_nome: user.empresa_nome,
      empresa_nome_fantasia: user.empresa_nome_fantasia,
      empresa_cnpj: user.empresa_cnpj,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
    };

    res.json(clientData);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    console.error('Erro ao obter usuário atual:', error);
    res.status(500).json({ error: 'Erro ao obter dados do usuário' });
  }
};

// Obter propostas do cliente
export const getProposals = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'client') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // Buscar propostas da empresa do cliente
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        titulo,
        descricao,
        status,
        valor_total,
        data_criacao,
        data_atualizacao
      FROM propostas_comerciais
      WHERE empresa_id = ?
      ORDER BY data_criacao DESC`,
      [decoded.empresa_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    res.status(500).json({ error: 'Erro ao buscar propostas' });
  }
};

// Obter detalhes de uma proposta
export const getProposalDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'client') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // Buscar proposta (verificando se pertence à empresa do cliente)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.*,
        e.razao_social as empresa_nome
      FROM propostas_comerciais p
      JOIN empresas e ON p.empresa_id = e.id
      WHERE p.id = ? AND p.empresa_id = ?`,
      [id, decoded.empresa_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    // Buscar itens da proposta
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM proposta_itens WHERE proposta_id = ? ORDER BY ordem`,
      [id]
    );

    const proposal = {
      ...rows[0],
      itens: items,
    };

    res.json(proposal);
  } catch (error) {
    console.error('Erro ao buscar detalhes da proposta:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da proposta' });
  }
};

// Obter documentos do cliente
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'client') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // Buscar nome da empresa
    const [empresaRows] = await pool.query<RowDataPacket[]>(
      `SELECT razao_social, nome_fantasia FROM empresas WHERE id = ?`,
      [decoded.empresa_id]
    );

    if (empresaRows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const empresa = empresaRows[0];
    const empresaNome = empresa.nome_fantasia || empresa.razao_social;

    // TODO: Implementar sistema de arquivos local
    // Por enquanto, retornar lista vazia
    const formattedDocs: any[] = [];

    res.json(formattedDocs);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
};

// Download de documento
export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'client') {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    console.log('[Client Portal] Download de arquivo solicitado:', id);

    // TODO: Implementar download de sistema local
    res.status(501).json({ error: 'Sistema de documentos em desenvolvimento' });
  } catch (error: any) {
    console.error('Erro ao baixar documento:', error);
    res.status(500).json({ error: 'Erro ao baixar documento' });
  }
};
