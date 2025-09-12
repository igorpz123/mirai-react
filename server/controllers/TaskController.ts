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
  LEFT JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
  LEFT JOIN empresas emp ON tsk.empresa_id = emp.id
  LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
  LEFT JOIN setor str ON tsk.setor_id = str.id
  LEFT JOIN unidades und ON tsk.unidade_id = und.id
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
  LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
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

export const getTaskByUser = async (req: Request<{ usuario_id: string }>, res: Response): Promise<void> => {
  try {
    const { usuario_id } = req.params;

    if (!usuario_id) {
      res.status(400).json({ message: 'ID do usuário é obrigatório' });
      return;
    }

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
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.responsavel_id = ?
        AND tsk.status <> 'Automático'
      ORDER BY tsk.prazo ASC
      `,
      [usuario_id]
    );

    // Formatar a resposta no padrão esperado pelo frontend
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
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.responsavel_id = ?
      ORDER BY tsk.prazo ASC
      `,
      [responsavel_id]
    );

    // normalize response to { tasks, total } like other endpoints
    const response = {
      tasks: (rows || []).map(row => ({
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
      total: (rows || []).length,
    };

    res.status(200).json(response);
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
        h.id,
        h.acao AS alteracao,
        h.observacoes,
        h.data_alteracao,
        -- actor (quem fez a alteração)
        u.id AS actor_id,
        u.nome AS actor_nome,
        u.sobrenome AS actor_sobrenome,
        u.foto_url AS actor_foto,

        -- anterior values (raw from JSON)
        JSON_UNQUOTE(JSON_EXTRACT(h.valor_anterior, '$.status')) AS anterior_status,
        JSON_UNQUOTE(JSON_EXTRACT(h.valor_anterior, '$.setor')) AS anterior_setor_id,
        JSON_UNQUOTE(JSON_EXTRACT(h.valor_anterior, '$.usuario')) AS anterior_usuario_id,

        -- novo values (raw from JSON)
        JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.status')) AS novo_status,
        JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.setor')) AS novo_setor_id,
        JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.usuario')) AS novo_usuario_id,

        -- resolved names for anterior/novo usuario and setor (if available)
        u_ant.nome AS anterior_usuario_nome,
        u_ant.sobrenome AS anterior_usuario_sobrenome,
        s_ant.nome AS anterior_setor_nome,

        u_new.nome AS novo_usuario_nome,
        u_new.sobrenome AS novo_usuario_sobrenome,
        s_new.nome AS novo_setor_nome
      FROM historico_alteracoes h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      LEFT JOIN usuarios u_ant ON CAST(JSON_UNQUOTE(JSON_EXTRACT(h.valor_anterior, '$.usuario')) AS UNSIGNED) = u_ant.id
      LEFT JOIN usuarios u_new ON CAST(JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.usuario')) AS UNSIGNED) = u_new.id
      LEFT JOIN setor s_ant ON CAST(JSON_UNQUOTE(JSON_EXTRACT(h.valor_anterior, '$.setor')) AS UNSIGNED) = s_ant.id
      LEFT JOIN setor s_new ON CAST(JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.setor')) AS UNSIGNED) = s_new.id
      WHERE h.tarefa_id = ?
      ORDER BY h.data_alteracao DESC
      `,
      [tarefa_id]
    );

    if (rows && (rows as any[]).length) {
      // map to a friendlier shape
      const mapped = (rows as any[]).map(r => ({
        id: r.id,
        acao: r.alteracao,
        observacoes: r.observacoes,
        data_alteracao: r.data_alteracao,
        actor: r.actor_id ? {
          id: r.actor_id,
          nome: r.actor_nome,
          sobrenome: r.actor_sobrenome,
          foto: r.actor_foto,
        } : null,
        anterior: {
          status: r.anterior_status || null,
          setor_id: r.anterior_setor_id ? Number(r.anterior_setor_id) : null,
          setor_nome: r.anterior_setor_nome || null,
          usuario_id: r.anterior_usuario_id ? Number(r.anterior_usuario_id) : null,
          usuario_nome: r.anterior_usuario_nome ? `${r.anterior_usuario_nome} ${r.anterior_usuario_sobrenome || ''}`.trim() : null,
        },
        novo: {
          status: r.novo_status || null,
          setor_id: r.novo_setor_id ? Number(r.novo_setor_id) : null,
          setor_nome: r.novo_setor_nome || null,
          usuario_id: r.novo_usuario_id ? Number(r.novo_usuario_id) : null,
          usuario_nome: r.novo_usuario_nome ? `${r.novo_usuario_nome} ${r.novo_usuario_sobrenome || ''}`.trim() : null,
        }
      }));

      res.status(200).json(mapped);
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

export const updateTaskResponsible = async (
  req: Request<{ tarefa_id: string }, {}, { usuarioId: number }>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id } = req.params;
    const { usuarioId } = req.body;

    if (!tarefa_id) {
      res.status(400).json({ message: 'ID da tarefa é obrigatório' });
      return;
    }

    if (typeof usuarioId !== 'number' || Number.isNaN(usuarioId)) {
      res.status(400).json({ message: 'usuarioId inválido' });
      return;
    }

    const updateQuery = `UPDATE tarefas SET responsavel_id = ? WHERE id = ?`;
    const [result] = await pool.query<OkPacket>(updateQuery, [usuarioId, tarefa_id]);

    if (result.affectedRows && result.affectedRows > 0) {
      res.status(200).json({ message: 'Responsável atualizado com sucesso' });
    } else {
      res.status(404).json({ message: 'Tarefa não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao atualizar responsável da tarefa:', error);
    res.status(500).json({ message: 'Erro ao atualizar responsável da tarefa' });
  }
};

export const getTaskStatsByUnidade = async (
  req: Request<{ unidade_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { unidade_id } = req.params;

    if (!unidade_id) {
      res.status(400).json({ message: 'ID da unidade é obrigatório' });
      return;
    }

    // overall counts by status
    const [rowsAll] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as cnt FROM tarefas WHERE unidade_id IN (?) GROUP BY status`,
      [unidade_id]
    );

    const totalByStatus: Record<string, number> = {};
    (rowsAll as any[]).forEach(r => {
      totalByStatus[r.status] = Number(r.cnt) || 0;
    });

    // compute trends: compare last 30 days vs previous 30 days
    const now = new Date();
    const currStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const currStartStr = currStart.toISOString().slice(0, 19).replace('T', ' ');
    const prevStartStr = prevStart.toISOString().slice(0, 19).replace('T', ' ');
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ');
    const prevEndStr = currStartStr;

    const [rowsCurr] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as cnt FROM tarefas WHERE unidade_id IN (?) AND created_at >= ? AND created_at < ? GROUP BY status`,
      [unidade_id, currStartStr, nowStr]
    );

    const [rowsPrev] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as cnt FROM tarefas WHERE unidade_id IN (?) AND created_at >= ? AND created_at < ? GROUP BY status`,
      [unidade_id, prevStartStr, prevEndStr]
    );

    const currMap: Record<string, number> = {};
    const prevMap: Record<string, number> = {};
    (rowsCurr as any[]).forEach(r => { currMap[r.status] = Number(r.cnt) || 0 });
    (rowsPrev as any[]).forEach(r => { prevMap[r.status] = Number(r.cnt) || 0 });

    const trendByStatus: Record<string, { current: number; previous: number; percent: number }> = {};
    const allStatuses = Array.from(new Set([ ...Object.keys(totalByStatus), ...Object.keys(currMap), ...Object.keys(prevMap) ]));
    allStatuses.forEach(s => {
      const c = currMap[s] || 0;
      const p = prevMap[s] || 0;
      const percent = p === 0 ? (c === 0 ? 0 : 100) : Math.round(((c - p) / p) * 10000) / 100;
      trendByStatus[s] = { current: c, previous: p, percent };
    });

    // overdue count (prazo < now and not concluded)
    const [rowsOverdue] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM tarefas WHERE unidade_id IN (?) AND prazo < ? AND status <> 'concluída'`,
      [unidade_id, nowStr]
    );
    const overdueCurrent = Number((rowsOverdue as any[])[0]?.cnt || 0);

    // previous overdue: count of tasks created in previous period that were overdue by prevEnd
    const [rowsPrevOverdue] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM tarefas WHERE unidade_id IN (?) AND created_at >= ? AND created_at < ? AND prazo < ? AND status <> 'concluída'`,
      [unidade_id, prevStartStr, prevEndStr, prevEndStr]
    );
    const overduePrev = Number((rowsPrevOverdue as any[])[0]?.cnt || 0);
    const overduePercent = overduePrev === 0 ? (overdueCurrent === 0 ? 0 : 100) : Math.round(((overdueCurrent - overduePrev) / overduePrev) * 10000) / 100;

    res.status(200).json({ totalByStatus, trendByStatus, overdue: { current: overdueCurrent, previous: overduePrev, percent: overduePercent } });
  } catch (error) {
    console.error('Erro ao calcular estatísticas de tarefas:', error);
    res.status(500).json({ message: 'Erro ao calcular estatísticas de tarefas' });
  }
};

export const getCompletedTasksByDayByUnidade = async (
  req: Request<{ unidade_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { unidade_id } = req.params;

    if (!unidade_id) {
      res.status(400).json({ message: 'ID da unidade é obrigatório' });
      return;
    }

    // Agrupa eventos de conclusão no histórico por data_alteracao (apenas data)
    // Considera ações: concluir_usuario, concluir_setor, concluir_arquivar
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT DATE(h.data_alteracao) AS date, COUNT(*) AS concluidas
      FROM historico_alteracoes h
      JOIN tarefas t ON t.id = h.tarefa_id
      WHERE t.unidade_id IN (?)
        AND h.acao IN ('concluir_usuario','concluir_setor','concluir_arquivar')
      GROUP BY DATE(h.data_alteracao)
      ORDER BY DATE(h.data_alteracao) ASC
      `,
      [unidade_id]
    );

    const result = (rows as any[]).map(r => {
      let dateStr: string | null = null;
      if (r.date) {
        if (r.date instanceof Date) {
          dateStr = r.date.toISOString().slice(0,10);
        } else {
          dateStr = String(r.date).slice(0,10);
        }
      }
      return { date: dateStr, concluidas: Number(r.concluidas) || 0 };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao buscar tarefas concluídas por dia:', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas concluídas por dia' });
  }
};

export const getTaskStatsByUsuario = async (
  req: Request<{ usuario_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { usuario_id } = req.params;

    if (!usuario_id) {
      res.status(400).json({ message: 'ID do usuário é obrigatório' });
      return;
    }

    // overall counts by status (filter by responsavel_id)
    const [rowsAll] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as cnt FROM tarefas WHERE responsavel_id = ? GROUP BY status`,
      [usuario_id]
    );

    const totalByStatus: Record<string, number> = {};
    (rowsAll as any[]).forEach(r => {
      totalByStatus[r.status] = Number(r.cnt) || 0;
    });

    // compute trends: compare last 30 days vs previous 30 days
    const now = new Date();
    const currStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const currStartStr = currStart.toISOString().slice(0, 19).replace('T', ' ');
    const prevStartStr = prevStart.toISOString().slice(0, 19).replace('T', ' ');
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ');
    const prevEndStr = currStartStr;

    const [rowsCurr] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as cnt FROM tarefas WHERE responsavel_id = ? AND created_at >= ? AND created_at < ? GROUP BY status`,
      [usuario_id, currStartStr, nowStr]
    );

    const [rowsPrev] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as cnt FROM tarefas WHERE responsavel_id = ? AND created_at >= ? AND created_at < ? GROUP BY status`,
      [usuario_id, prevStartStr, prevEndStr]
    );

    const currMap: Record<string, number> = {};
    const prevMap: Record<string, number> = {};
    (rowsCurr as any[]).forEach(r => { currMap[r.status] = Number(r.cnt) || 0 });
    (rowsPrev as any[]).forEach(r => { prevMap[r.status] = Number(r.cnt) || 0 });

    const trendByStatus: Record<string, { current: number; previous: number; percent: number }> = {};
    const allStatuses = Array.from(new Set([ ...Object.keys(totalByStatus), ...Object.keys(currMap), ...Object.keys(prevMap) ]));
    allStatuses.forEach(s => {
      const c = currMap[s] || 0;
      const p = prevMap[s] || 0;
      const percent = p === 0 ? (c === 0 ? 0 : 100) : Math.round(((c - p) / p) * 10000) / 100;
      trendByStatus[s] = { current: c, previous: p, percent };
    });

    // overdue count (prazo < now and not concluded)
    const [rowsOverdue] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM tarefas WHERE responsavel_id = ? AND prazo < ? AND status <> 'concluída'`,
      [usuario_id, nowStr]
    );
    const overdueCurrent = Number((rowsOverdue as any[])[0]?.cnt || 0);

    const [rowsPrevOverdue] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM tarefas WHERE responsavel_id = ? AND created_at >= ? AND created_at < ? AND prazo < ? AND status <> 'concluída'`,
      [usuario_id, prevStartStr, prevEndStr, prevEndStr]
    );
    const overduePrev = Number((rowsPrevOverdue as any[])[0]?.cnt || 0);
    const overduePercent = overduePrev === 0 ? (overdueCurrent === 0 ? 0 : 100) : Math.round(((overdueCurrent - overduePrev) / overduePrev) * 10000) / 100;

    res.status(200).json({ totalByStatus, trendByStatus, overdue: { current: overdueCurrent, previous: overduePrev, percent: overduePercent } });
  } catch (error) {
    console.error('Erro ao calcular estatísticas de tarefas (usuario):', error);
    res.status(500).json({ message: 'Erro ao calcular estatísticas de tarefas' });
  }
};

export const getCompletedTasksByDayByUsuario = async (
  req: Request<{ usuario_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { usuario_id } = req.params;

    if (!usuario_id) {
      res.status(400).json({ message: 'ID do usuário é obrigatório' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT DATE(h.data_alteracao) AS date, COUNT(*) AS concluidas
      FROM historico_alteracoes h
      JOIN tarefas t ON t.id = h.tarefa_id
      WHERE t.responsavel_id = ?
        AND h.acao IN ('concluir_usuario','concluir_setor','concluir_arquivar')
      GROUP BY DATE(h.data_alteracao)
      ORDER BY DATE(h.data_alteracao) ASC
      `,
      [usuario_id]
    );

    const result = (rows as any[]).map(r => {
      let dateStr: string | null = null;
      if (r.date) {
        if (r.date instanceof Date) {
          dateStr = r.date.toISOString().slice(0,10);
        } else {
          dateStr = String(r.date).slice(0,10);
        }
      }
      return { date: dateStr, concluidas: Number(r.concluidas) || 0 };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao buscar tarefas concluídas por dia (usuario):', error);
    res.status(500).json({ message: 'Erro ao buscar tarefas concluídas por dia' });
  }
};

export const getTasksByEmpresa = async (req: Request<{ empresa_id: string }>, res: Response): Promise<void> => {
  try {
    const { empresa_id } = req.params

    if (!empresa_id) {
      res.status(400).json({ message: 'ID da empresa é obrigatório' })
      return
    }

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
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      JOIN setor str ON tsk.setor_id = str.id
      JOIN unidades und ON tsk.unidade_id = und.id
      WHERE tsk.empresa_id = ?
      ORDER BY tsk.prazo ASC
      `,
      [empresa_id]
    )

    const response = {
      tasks: (rows || []).map(row => ({
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
      total: (rows || []).length,
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Erro ao buscar tarefas por empresa:', error)
    res.status(500).json({ message: 'Erro ao buscar tarefas' })
  }
}

// Adiciona uma observação ao histórico da tarefa
// (mantida implementação única de addTaskObservation abaixo)

// Adiciona uma observação no histórico da tarefa
export const addTaskObservation = async (
  req: Request<{ tarefa_id: string }, {}, { usuario_id: number; observacoes: string }>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id } = req.params;
    const { usuario_id, observacoes } = req.body || {} as any;

    if (!tarefa_id) {
      res.status(400).json({ message: 'ID da tarefa é obrigatório' });
      return;
    }
    if (!usuario_id || typeof usuario_id !== 'number') {
      res.status(400).json({ message: 'usuario_id inválido' });
      return;
    }
    if (!observacoes || typeof observacoes !== 'string' || !observacoes.trim()) {
      res.status(400).json({ message: 'observações são obrigatórias' });
      return;
    }

    const insertSql = `
      INSERT INTO historico_alteracoes
        (tarefa_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
      VALUES (?, ?, 'adicionar_observacao', NULL, NULL, ?, NOW())
    `;

    const [result] = await pool.query<OkPacket>(insertSql, [tarefa_id, usuario_id, observacoes.trim()]);

    res.status(201).json({ message: 'Observação adicionada com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    res.status(500).json({ message: 'Erro ao adicionar observação' });
  }
};