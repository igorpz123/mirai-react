import { Request, Response } from 'express';
import { RowDataPacket, OkPacket } from 'mysql2';
import pool from '../config/db';

type TaskRow = RowDataPacket & {
  tarefa_id: number;
  finalidade: string;
  prioridade: string;
  status: string;
  setor_id: number;
  responsavel_id: number | null;
  unidade_id: number;
  prazo: string;
  empresa_nome: string;
  empresa_social: string;
  empresa_cnpj: string;
  empresa_cidade: string;
  responsavel_nome: string;
  responsavel_sobrenome?: string;
  setor_nome: string;
  unidade_nome: string;
};

export const getAllTasks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<TaskRow[]>(`
      SELECT 
        tsk.id AS tarefa_id, 
        tpt.tipo AS finalidade, 
        tsk.prioridade, 
        tsk.status,
        tsk.setor_id,
        tsk.responsavel_id,
        tsk.unidade_id,
        tsk.prazo,
        emp.nome_fantasia AS empresa_nome,
        emp.razao_social AS empresa_social,
        emp.cnpj AS empresa_cnpj,
        emp.cidade AS empresa_cidade,
        usr_tarefa.nome AS responsavel_nome, 
        str.nome AS setor_nome,
        und.nome AS unidade_nome
      FROM tarefas tsk
      JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      JOIN empresas emp ON tsk.empresa_id = emp.id
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.status NOT IN ('Automático')
      ORDER BY tsk.prazo ASC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas' });
  }
};

export const getTaskById = async (req: Request<{ tarefa_id: string }>, res: Response): Promise<void> => {
  try {
    const { tarefa_id } = req.params;
    const [rows] = await pool.query<TaskRow[]>(
      `
      SELECT 
        tsk.id AS tarefa_id, 
        tpt.tipo AS finalidade, 
        tsk.prioridade, 
        tsk.status,
        tsk.prazo,
        tsk.setor_id,
        tsk.responsavel_id,
        tsk.unidade_id,
        emp.nome_fantasia AS empresa_nome,
        emp.razao_social AS empresa_social,
        emp.cnpj AS empresa_cnpj,
        emp.cidade AS empresa_cidade,
        usr_tarefa.nome AS responsavel_nome,
        usr_tarefa.sobrenome AS responsavel_sobrenome,
        str.nome AS setor_nome,
        und.nome AS unidade_nome
      FROM tarefas tsk
      JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      JOIN empresas emp ON tsk.empresa_id = emp.id
      JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.id = ?
      `,
      [tarefa_id]
    );

    if (rows.length) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: 'Tarefa não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefa' });
  }
};

export const getTaskByUser = async (req: Request<{ user_id: string }>, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;
    const [rows] = await pool.query<TaskRow[]>(
      `
      SELECT 
        tsk.id AS tarefa_id, 
        tpt.tipo AS finalidade, 
        tsk.prioridade, 
        tsk.status,
        tsk.prazo,
        tsk.setor_id,
        tsk.responsavel_id,
        tsk.unidade_id,
        emp.nome_fantasia AS empresa_nome,
        emp.razao_social AS empresa_social,
        emp.cnpj AS empresa_cnpj,
        emp.cidade AS empresa_cidade,
        usr_tarefa.nome AS responsavel_nome, 
        str.nome AS setor_nome,
        und.nome AS unidade_nome
      FROM tarefas tsk
      JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      JOIN empresas emp ON tsk.empresa_id = emp.id
      JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.responsavel_id = ?
        AND tsk.status <> 'Automático'
      ORDER BY tsk.prazo ASC
      `,
      [user_id]
    );

    if (rows.length) {
      res.status(200).json(rows);
    } else {
      res.status(404).json({ message: 'Nenhuma tarefa encontrada para este usuário' });
    }
  } catch (error) {
    console.error('Erro ao buscar tarefas por usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas' });
  }
};

export const getTaskByResponsavel = async (req: Request<{ responsavel_id: string }>, res: Response): Promise<void> => {
  try {
    const { responsavel_id } = req.params;
    const [rows] = await pool.query<TaskRow[]>(
      `
      SELECT 
        tsk.id AS tarefa_id, 
        tpt.tipo AS finalidade, 
        tsk.prioridade, 
        tsk.status,
        tsk.prazo,
        tsk.setor_id,
        tsk.responsavel_id,
        tsk.unidade_id,
        emp.nome_fantasia AS empresa_nome,
        emp.razao_social AS empresa_social,
        emp.cnpj AS empresa_cnpj,
        emp.cidade AS empresa_cidade,
        usr_tarefa.nome AS responsavel_nome, 
        str.nome AS setor_nome,
        und.nome AS unidade_nome
      FROM tarefas tsk
      JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      JOIN empresas emp ON tsk.empresa_id = emp.id
      JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE emp.tecnico_responsavel = ?
      ORDER BY tsk.prazo ASC
      `,
      [responsavel_id]
    );

    if (rows.length) {
      res.status(200).json(rows);
    } else {
      res.status(404).json({ message: 'Nenhuma tarefa encontrada para este responsável' });
    }
  } catch (error) {
    console.error('Erro ao buscar tarefas por responsável:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas' });
  }
};

export const getTaskByUnidade = async (
  req: Request<{ unidade_id: string }>, // Mudança aqui
  res: Response
): Promise<void> => {
  try {
    // Pegar o ID da rota ao invés de query
    const { unidade_id } = req.params;
    
    if (!unidade_id) {
      res.status(400).json({ message: 'ID da unidade é obrigatório' });
      return;
    }

    const [rows] = await pool.query<TaskRow[]>(
      `
      SELECT 
        tsk.id AS tarefa_id, 
        tpt.tipo AS finalidade, 
        tsk.prioridade, 
        tsk.status,
        tsk.setor_id,
        tsk.responsavel_id,
        tsk.unidade_id,
        tsk.prazo,
        emp.nome_fantasia AS empresa_nome,
        emp.razao_social AS empresa_social,
        emp.cnpj AS empresa_cnpj,
        emp.cidade AS empresa_cidade,
        usr_tarefa.nome AS responsavel_nome, 
        str.nome AS setor_nome,
        und.nome AS unidade_nome
      FROM tarefas tsk
      JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      JOIN empresas emp ON tsk.empresa_id = emp.id
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.unidade_id IN (?)
        AND tsk.status <> 'Automático'
      ORDER BY tsk.prazo ASC
      `,
      [unidade_id]
    );

    // Formatar a resposta no padrão esperado
    const response = {
      tasks: rows.map(row => ({
        id: row.tarefa_id,
        empresa: row.empresa_nome,
        unidade: row.unidade_nome,
        finalidade: row.finalidade,
        status: row.status,
        prioridade: row.prioridade,
        setor: row.setor_nome,
        prazo: row.prazo,
        responsavel: row.responsavel_nome || 'Não atribuído',
      })),
      total: rows.length
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao buscar tarefas por unidade:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas' });
  }
};

export const getTaskByUnidadeSetor = async (
  req: Request<{}, {}, {}, { unidades_id: string | string[]; setores_id: string | string[] }>,
  res: Response
): Promise<void> => {
  try {
    let { unidades_id, setores_id } = req.query;
    if (typeof unidades_id === 'string') unidades_id = unidades_id.split(',');
    if (typeof setores_id === 'string') setores_id = setores_id.split(',');

    const [rows] = await pool.query<TaskRow[]>(
      `
      SELECT 
        tsk.id AS tarefa_id, 
        tpt.tipo AS finalidade, 
        tsk.prioridade, 
        tsk.status,
        tsk.setor_id,
        tsk.responsavel_id,
        tsk.unidade_id,
        tsk.prazo,
        emp.nome_fantasia AS empresa_nome,
        emp.razao_social AS empresa_social,
        emp.cnpj AS empresa_cnpj,
        emp.cidade AS empresa_cidade,
        usr_tarefa.nome AS responsavel_nome, 
        str.nome AS setor_nome,
        und.nome AS unidade_nome
      FROM tarefas tsk
      JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      JOIN empresas emp ON tsk.empresa_id = emp.id
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.unidade_id IN (?)
        AND tsk.setor_id IN (?)
        AND tsk.status <> 'Automático'
      ORDER BY tsk.prazo ASC
      `,
      [unidades_id, setores_id]
    );

    if (rows.length) {
      res.status(200).json(rows);
    } else {
      res
        .status(404)
        .json({ message: 'Nenhuma tarefa encontrada para estas unidades e setores' });
    }
  } catch (error) {
    console.error('Erro ao buscar tarefas por unidade e setor:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas' });
  }
};

export const getArquivosByTarefa = async (
  req: Request<{ tarefa_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        nome_arquivo,
        caminho
      FROM arquivos
      WHERE tarefa_id = ?
      `,
      [tarefa_id]
    );

    if (rows.length) {
      res.status(200).json(rows);
    } else {
      res.status(404).json({ message: 'Nenhum arquivo encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    res.status(500).json({ message: 'Erro ao buscar arquivos' });
  }
};

export const getTaskHistory = async (
  req: Request<{ tarefa_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        h.alteracao,
        h.observacoes,
        h.data_alteracao,
        u.nome,
        u.sobrenome,
        u.foto_url
      FROM historico_alteracoes h
      JOIN usuarios u ON h.usuario_id = u.id
      WHERE tarefa_id = ?
      ORDER BY h.data_alteracao DESC
      `,
      [tarefa_id]
    );

    if (rows.length) {
      res.status(200).json(rows);
    } else {
      res.status(404).json({ message: 'Nenhum histórico encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
};

interface NewTaskBody {
  empresa_id: number;
  finalidade: number;
  prioridade: string;
  status: string;
  prazo: string;
  setor_id: number;
  responsavel_id: number | null;
  created_at: string;
  created_by: number;
  unidade_id: number;
}

export const newTask = async (
  req: Request<{}, {}, NewTaskBody>,
  res: Response
): Promise<void> => {
  try {
    const {
      empresa_id,
      finalidade,
      prioridade,
      status,
      prazo,
      setor_id,
      responsavel_id,
      created_at,
      created_by,
      unidade_id,
    } = req.body;

    const insertQuery = `
      INSERT INTO tarefas
        (empresa_id, finalidade_id, prioridade, status, prazo, setor_id, responsavel_id, created_at, created_by, unidade_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      empresa_id,
      finalidade,
      prioridade,
      status,
      prazo,
      setor_id,
      responsavel_id,
      created_at,
      created_by,
      unidade_id,
    ];

    const [result] = await pool.query<OkPacket>(insertQuery, values);
    res
      .status(201)
      .json({ message: 'Tarefa criada com sucesso', tarefa_id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ message: 'Erro ao criar tarefa' });
  }
};