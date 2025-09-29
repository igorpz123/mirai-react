import { Request, Response } from 'express';
import fs from 'fs'
import path from 'path'
import { PUBLIC_UPLOADS_DIR } from '../middleware/upload'
import { RowDataPacket, OkPacket } from 'mysql2';
import pool from '../config/db';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';
import { createNotification } from '../services/notificationService'
import { getIO } from '../realtime'

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

// Upload a file for a specific task
export const uploadArquivoTarefa = async (
  req: Request<{ tarefa_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id } = req.params
  const file = (req as any).file as any
    if (!file) {
      res.status(400).json({ message: 'Arquivo não enviado' })
      return
    }
  const nome = file.originalname
  // Public path exposed at /uploads (folder: task-<id>)
  const caminhoPublico = `/uploads/task-${tarefa_id}/${file.filename}`
    const [result] = await pool.query<OkPacket>(
      `INSERT INTO arquivos (tarefa_id, nome_arquivo, caminho, created_at) VALUES (?, ?, ?, NOW())`,
      [tarefa_id, nome, caminhoPublico]
    )
    res.status(201).json({ id: (result as any).insertId, nome_arquivo: nome, caminho: caminhoPublico })
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo da tarefa:', error)
    res.status(500).json({ message: 'Erro ao fazer upload de arquivo' })
  }
}

// Delete a task file
export const deleteArquivoTarefa = async (
  req: Request<{ tarefa_id: string; arquivo_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id, arquivo_id } = req.params
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, caminho FROM arquivos WHERE id = ? AND tarefa_id = ? LIMIT 1`,
      [arquivo_id, tarefa_id]
    )
    if (!rows || rows.length === 0) {
      res.status(404).json({ message: 'Arquivo não encontrado' })
      return
    }
    const fileRow: any = rows[0]
    await pool.query<OkPacket>(`DELETE FROM arquivos WHERE id = ?`, [arquivo_id])
    // Attempt safe filesystem removal (only inside uploads dir)
    try {
      const publicPath = String(fileRow.caminho || '')
      if (publicPath.startsWith('/uploads/')) {
        const fileAbs = path.join(PUBLIC_UPLOADS_DIR, publicPath.replace('/uploads/', ''))
        // ensure resolved path remains inside uploads dir
        const resolved = path.resolve(fileAbs)
        if (resolved.startsWith(PUBLIC_UPLOADS_DIR)) {
          fs.unlink(resolved, () => { /* ignore errors */ })
        }
      }
    } catch {}
    res.status(200).json({ deleted: true, id: fileRow.id })
  } catch (error) {
    console.error('Erro ao excluir arquivo da tarefa:', error)
    res.status(500).json({ message: 'Erro ao excluir arquivo' })
  }
}

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
        -- rating fields (may not exist; if they do, use them)
        h.avaliacao_nota,
        h.avaliacao_by,
        h.avaliacao_obs,
        h.avaliacao_data,
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
  s_new.nome AS novo_setor_nome,

  u_av.nome AS u_av_nome,
  u_av.sobrenome AS u_av_sobrenome,
  u_av.foto_url AS u_av_foto
      FROM historico_alteracoes h
  LEFT JOIN usuarios u ON h.usuario_id = u.id
  LEFT JOIN usuarios u_av ON h.avaliacao_by = u_av.id
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
        avaliacao: (r.avaliacao_nota != null || r.avaliacao_data != null) ? {
          nota: r.avaliacao_nota != null ? Number(r.avaliacao_nota) : null,
          data: r.avaliacao_data || null,
          obs: r.avaliacao_obs || null,
          by: r.avaliacao_by ? {
            id: r.avaliacao_by,
            nome: r.u_av_nome || undefined,
            sobrenome: r.u_av_sobrenome || undefined,
            foto: r.u_av_foto || undefined,
          } : null,
        } : null,
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

// Avaliar uma entrada do histórico da tarefa (somente admin)
export const rateTaskHistory = async (
  req: Request<{ historico_id: string }, {}, { nota: number; observacao?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { historico_id } = req.params
    const { nota, observacao } = req.body || ({} as any)

    if (!historico_id) {
      res.status(400).json({ message: 'ID do histórico é obrigatório' })
      return
    }
    const n = Number(nota)
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      res.status(400).json({ message: 'Nota inválida. Deve estar entre 0 e 10.' })
      return
    }

    // Auth and role check
    let actorId: number | null = null
    const authHeader = req.headers && (req.headers.authorization as string | undefined)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
        actorId = payload?.userId ?? payload?.id ?? null
      } catch {}
    }
    if (!actorId) {
      res.status(401).json({ message: 'Não autorizado' })
      return
    }
    // Only admin (cargo_id = 1) can rate
    const [uRows] = await pool.query<RowDataPacket[]>(`SELECT cargo_id FROM usuarios WHERE id = ? LIMIT 1`, [actorId])
    const cargoId = Number((uRows as any[])[0]?.cargo_id || 0)
    if (cargoId !== 1) {
      res.status(403).json({ message: 'Somente administradores podem avaliar alterações' })
      return
    }

    // Ensure record exists
    const [hRows] = await pool.query<RowDataPacket[]>(`SELECT id FROM historico_alteracoes WHERE id = ? LIMIT 1`, [historico_id])
    if (!(hRows as any[]).length) {
      res.status(404).json({ message: 'Histórico não encontrado' })
      return
    }

    // Update rating fields (columns must exist in DB)
    const sql = `UPDATE historico_alteracoes SET avaliacao_nota = ?, avaliacao_by = ?, avaliacao_obs = ?, avaliacao_data = NOW() WHERE id = ?`
    await pool.query<OkPacket>(sql, [n, actorId, (observacao ?? null), historico_id])

    // Notify the user who performed the original action (actor of that historico)
    try {
      const [hInfoRows] = await pool.query<RowDataPacket[]>(
        `SELECT h.tarefa_id, h.usuario_id AS actor_original, t.responsavel_id
         FROM historico_alteracoes h
         LEFT JOIN tarefas t ON t.id = h.tarefa_id
         WHERE h.id = ? LIMIT 1`,
        [historico_id]
      )
      const hInfo: any = (hInfoRows as any[])[0] || null
      const targetUserId = Number(hInfo?.actor_original || hInfo?.responsavel_id || 0)
      if (targetUserId) {
        const anchor = Number(historico_id)
        const tarefaIdNum = Number(hInfo?.tarefa_id || 0)
        const link = tarefaIdNum ? `/technical/tarefa/${tarefaIdNum}#hist-${anchor}` : undefined
        const notif = await createNotification({
          user_id: targetUserId,
          actor_id: actorId,
          type: 'task_rated',
          title: 'Você recebeu uma avaliação',
          body: `Sua atuação em uma alteração da tarefa ${hInfo?.tarefa_id ?? ''} foi avaliada com nota ${n}.`,
          entity_type: 'task',
          entity_id: tarefaIdNum,
          metadata: { historico_id: anchor, tarefa_id: tarefaIdNum, nota: n, observacao: observacao ?? null, link },
        })
        // Realtime via socket
        try {
          const legacyPayload = {
            id: notif.id,
            user_id: notif.user_id,
            type: notif.type,
            entity: notif.entity_type,
            entity_id: notif.entity_id,
            message: notif.body,
            metadata: notif.metadata,
            created_at: notif.created_at,
            read_at: notif.read_at,
          }
          getIO().to(`user:${targetUserId}`).emit('notification:new', legacyPayload)
        } catch {}
      }
    } catch (e) {
      console.warn('Falha ao notificar avaliação:', e)
    }

    res.status(200).json({ message: 'Avaliação registrada' })
  } catch (error) {
    console.error('Erro ao avaliar histórico:', error)
    res.status(500).json({ message: 'Erro ao avaliar histórico' })
  }
}

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
  observacoes?: string | null;
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
      observacoes,
    } = req.body as NewTaskBody;

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
    const insertedId = result.insertId;

    // try to insert a creation entry in historico_alteracoes following PHP logic
    try {
      const acao = 'criar';
      const novo_valor = JSON.stringify({ usuario: created_by });
      const valor_anterior = JSON.stringify({ usuario: null });
      const insertHist = `
        INSERT INTO historico_alteracoes
          (tarefa_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      await pool.query<OkPacket>(insertHist, [insertedId, created_by, acao, valor_anterior, novo_valor, observacoes || null]);
    } catch (histErr) {
      console.error('Erro ao inserir histórico de criação da tarefa:', histErr);
      // don't block the main response — log and continue
    }

    // Notify responsible if assigned
    if (responsavel_id) {
      try {
        const notif = await createNotification({
          user_id: Number(responsavel_id),
          actor_id: created_by ? Number(created_by) : null,
          type: 'task_assigned',
          body: 'Nova tarefa atribuída a você',
          entity_type: 'task',
          entity_id: insertedId,
          metadata: { tarefa_id: insertedId, prioridade, prazo, link: `/technical/tarefa/${insertedId}` },
        })
        const legacyPayload = {
          id: notif.id,
          user_id: notif.user_id,
          type: notif.type,
          entity: notif.entity_type,
          entity_id: notif.entity_id,
          message: notif.body,
          metadata: notif.metadata,
          created_at: notif.created_at,
          read_at: notif.read_at,
        }
        try { getIO().to(`user:${responsavel_id}`).emit('notification:new', legacyPayload) } catch {}
      } catch (e) { console.warn('Falha ao criar notificação de nova tarefa:', e) }
    }

    res.status(201).json({ message: 'Tarefa criada com sucesso', tarefa_id: insertedId });
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
      // Create notification for new responsible
      try {
        const notif = await createNotification({
          user_id: Number(usuarioId),
          actor_id: null,
          type: 'task_assigned',
          body: 'Você foi designado como responsável por uma tarefa',
          entity_type: 'task',
          entity_id: Number(tarefa_id),
          metadata: { tarefa_id: Number(tarefa_id), link: `/technical/tarefa/${tarefa_id}` },
        })
        const legacyPayload = {
          id: notif.id,
          user_id: notif.user_id,
          type: notif.type,
          entity: notif.entity_type,
          entity_id: notif.entity_id,
          message: notif.body,
          metadata: notif.metadata,
          created_at: notif.created_at,
          read_at: notif.read_at,
        }
        try { getIO().to(`user:${usuarioId}`).emit('notification:new', legacyPayload) } catch {}
      } catch (e) { console.warn('Falha ao criar notificação de designação:', e) }
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

    // Notify current responsible (if any and not same as actor)
    try {
      const [respRows] = await pool.query<RowDataPacket[]>(`SELECT responsavel_id FROM tarefas WHERE id = ?`, [tarefa_id])
      const respId = (respRows as any[])[0]?.responsavel_id
      if (respId && Number(respId) !== Number(usuario_id)) {
        const notif = await createNotification({
          user_id: Number(respId),
          actor_id: Number(usuario_id),
          type: 'task_observation',
          body: 'Nova observação adicionada à sua tarefa',
          entity_type: 'task',
          entity_id: Number(tarefa_id),
          metadata: { tarefa_id: Number(tarefa_id), observacao_id: (result as any).insertId, link: `/technical/tarefa/${tarefa_id}` },
        })
        const legacyPayload = {
          id: notif.id,
          user_id: notif.user_id,
          type: notif.type,
          entity: notif.entity_type,
          entity_id: notif.entity_id,
          message: notif.body,
          metadata: notif.metadata,
          created_at: notif.created_at,
          read_at: notif.read_at,
        }
        try { getIO().to(`user:${respId}`).emit('notification:new', legacyPayload) } catch {}
      }
    } catch (e) { console.warn('Falha ao notificar observação de tarefa:', e) }

    res.status(201).json({ message: 'Observação adicionada com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    res.status(500).json({ message: 'Erro ao adicionar observação' });
  }
};

// Atualiza campos da tarefa (status, setor, responsavel, etc.) e registra histórico
export const updateTask = async (
  req: Request<{ tarefa_id: string }, {}, Partial<{ status: string; setorId: number; usuarioId: number }>>,
  res: Response
): Promise<void> => {
  try {
    const { tarefa_id } = req.params;
    const { status, setorId, usuarioId } = req.body || {} as any;

    if (!tarefa_id) {
      res.status(400).json({ message: 'ID da tarefa é obrigatório' });
      return;
    }

    // Determine actor (quem realiza a ação) from Authorization Bearer token
    let actorId: number | null = null;
    const authHeader = req.headers && (req.headers.authorization as string | undefined);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, authConfig.jwtSecret as string) as any;
        actorId = payload?.userId ?? payload?.id ?? null;
      } catch (e) {
        console.warn('Failed to verify JWT for actor extraction:', e);
        // if token invalid, we will reject later
      }
    }

    // fallback: if caller passed usuarioId explicitly, use that as actor
    if (!actorId && typeof usuarioId === 'number') {
      actorId = usuarioId;
    }

    if (!actorId) {
      res.status(401).json({ message: 'Usuário autenticado é obrigatório para registrar histórico da ação' });
      return;
    }

    // fetch current task to build historico (valor_anterior)
    const [existingRows] = await pool.query<RowDataPacket[]>(`SELECT id, status, setor_id, responsavel_id FROM tarefas WHERE id = ?`, [tarefa_id]);
    if (!(existingRows as any[]).length) {
      res.status(404).json({ message: 'Tarefa não encontrada' });
      return;
    }
    const existing = (existingRows as any[])[0];

  // build update parts — treat presence of the property as intent to update,
    // allowing null to explicitly clear fields. This prevents the server from
    // ignoring null values sent by the client.
    const updates: string[] = [];
    const values: any[] = [];

    // debug incoming payload for easier troubleshooting (can be removed later)
    try { console.info('updateTask payload:', { status, setorId, usuarioId }) } catch (e) { /* ignore */ }

    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      updates.push('status = ?');
      values.push(status);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'setorId')) {
      updates.push('setor_id = ?');
      values.push(setorId);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'usuarioId')) {
      updates.push('responsavel_id = ?');
      values.push(usuarioId);
    }

    if (!updates.length) {
      res.status(400).json({ message: 'Nenhum campo válido para atualizar' });
      return;
    }

    // always update data_alteracao to NOW()
    updates.push('data_alteracao = NOW()');

    const updateQuery = `UPDATE tarefas SET ${updates.join(', ')} WHERE id = ?`;
    values.push(tarefa_id);

    const [result] = await pool.query<OkPacket>(updateQuery, values);

    if (!result.affectedRows || result.affectedRows === 0) {
      res.status(404).json({ message: 'Tarefa não encontrada' });
      return;
    }

    // insert historico following PHP semantics for conclude/designate/archive actions
    try {
      const norm = (s: any) => (s == null ? '' : String(s)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      const existingStatusNorm = norm(existing.status)
      const statusNorm = norm(status)
      let acao: string;

      // detect whether caller provided designated setor/usuario
      const hasSetorDesignado = Object.prototype.hasOwnProperty.call(req.body, 'setorId');
      const setorDesignado = hasSetorDesignado ? (setorId as any) : null;
      const hasUserDesignado = Object.prototype.hasOwnProperty.call(req.body, 'usuarioId') && usuarioId != null;

      // default previous/next values include status/setor/usuario
      let valorAnteriorObj: any = { status: existing.status, setor: existing.setor_id, usuario: existing.responsavel_id };
      let novoValorObj: any = { status: status ?? existing.status, setor: setorId ?? existing.setor_id, usuario: usuarioId ?? existing.responsavel_id };

      // Consider a 'conclude' operation either when status explicitly indicates conclusion
      // or when the client sends a designation (setorId/usuarioId) with status 'pendente'
      // while the current task was 'progress' — this matches the PHP flow where
      // conclude+designate results in status 'pendente' but action 'concluir_*'.
      const explicitConclude = typeof status === 'string' && statusNorm.includes('concl');
      const implicitConcludeByDesignation = typeof status === 'string' && statusNorm === 'pendente' && (hasSetorDesignado || hasUserDesignado) && existingStatusNorm.includes('progress');
      const isConclude = explicitConclude || implicitConcludeByDesignation;

      // Special case: 'designar' when a task is Automatic and gets assigned
      // Covers two flows:
      // 1) Single assignment: client sends usuarioId (hasUserDesignado)
      // 2) Bulk designation: client sets status='pendente' and task already has responsavel_id
      const isStatusToPending = typeof status === 'string' && statusNorm === 'pendente';
      const hasExistingResponsible = existing.responsavel_id != null;
      const isDesignateFromAutomatic = (existingStatusNorm === 'automatico') && (
        (hasUserDesignado && usuarioId != null) ||
        (isStatusToPending && hasExistingResponsible)
      );
      // Generic designation: whenever caller explicitly sets usuarioId and also sets status to pendente
      const isDesignateGeneric = hasUserDesignado && isStatusToPending;

      if (isDesignateFromAutomatic || isDesignateGeneric) {
        acao = 'designar';
        // For designation, record actor as valor_anterior.usuario and designated user as novo_valor.usuario
        valorAnteriorObj = { usuario: actorId };
        // If usuarioId not provided (bulk), keep the existing responsavel as the designated target
        novoValorObj = { usuario: (hasUserDesignado && usuarioId != null) ? usuarioId : existing.responsavel_id };
      } else if (isConclude) {
        if (setorDesignado === null) {
          acao = 'concluir_arquivar';
          // novo valor should reflect the designated target (null)
          valorAnteriorObj = { setor: existing.setor_id, usuario: existing.responsavel_id };
          novoValorObj = { setor: null, usuario: null };
        } else {
          // designated to setor or user
          acao = hasUserDesignado ? 'concluir_usuario' : 'concluir_setor';
          valorAnteriorObj = { setor: existing.setor_id, usuario: existing.responsavel_id };
          novoValorObj = { setor: setorId ?? null, usuario: usuarioId ?? null };
        }
      } else if (typeof status === 'string' && status === 'progress') {
        acao = 'iniciar';
      } else {
        acao = typeof status === 'string' ? status : 'atualizar';
      }

      const valor_anterior = JSON.stringify(valorAnteriorObj);
      const novo_valor = JSON.stringify(novoValorObj);

      const insertHist = `
        INSERT INTO historico_alteracoes
          (tarefa_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      await pool.query<OkPacket>(insertHist, [tarefa_id, actorId, acao, valor_anterior, novo_valor, null]);
    } catch (histErr) {
      console.error('Erro ao inserir histórico da atualização da tarefa:', histErr);
      // don't block the response
    }

    // Caso tenha havido mudança de responsável via updateTask (PUT)
    try {
      const responsavelMudou = Object.prototype.hasOwnProperty.call(req.body, 'usuarioId') && usuarioId != null && Number(usuarioId) !== Number(existing.responsavel_id)
      if (responsavelMudou) {
        const notif = await createNotification({
          user_id: Number(usuarioId),
          actor_id: actorId || null,
          type: 'task_assigned',
          body: 'Você foi designado como responsável por uma tarefa',
          entity_type: 'task',
          entity_id: Number(tarefa_id),
          metadata: { tarefa_id: Number(tarefa_id), link: `/technical/tarefa/${tarefa_id}` },
        })
        const legacyPayload = {
          id: notif.id,
          user_id: notif.user_id,
          type: notif.type,
          entity: notif.entity_type,
          entity_id: notif.entity_id,
          message: notif.body,
          metadata: notif.metadata,
          created_at: notif.created_at,
          read_at: notif.read_at,
        }
        try { getIO().to(`user:${usuarioId}`).emit('notification:new', legacyPayload) } catch {}
      }
    } catch (notifyErr) {
      console.warn('Falha ao notificar mudança de responsável (updateTask):', notifyErr)
    }

    res.status(200).json({ message: 'Tarefa atualizada com sucesso' });
    // If status changed to something near deadline or conclude etc., we can add future hooks here.
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ message: 'Erro ao atualizar tarefa' });
  }
};

// Tarefas recentemente alteradas por um usuário (com base no historico_alteracoes)
export const getRecentTasksByUsuario = async (
  req: Request<{ usuario_id: string }, {}, {}, { limit?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { usuario_id } = req.params
    const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 10)))

    if (!usuario_id) {
      res.status(400).json({ message: 'ID do usuário é obrigatório' })
      return
    }

    const [rows] = await pool.query<RowDataPacket[]>(
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
        und.nome AS unidade_nome,
        MAX(h.data_alteracao) AS ultima_alteracao
      FROM historico_alteracoes h
      JOIN tarefas tsk ON tsk.id = h.tarefa_id
      LEFT JOIN tipo_tarefa tpt ON tsk.finalidade_id = tpt.id
      LEFT JOIN empresas emp ON tsk.empresa_id = emp.id
      LEFT JOIN usuarios usr_tarefa ON tsk.responsavel_id = usr_tarefa.id
      LEFT JOIN setor str ON tsk.setor_id = str.id
      LEFT JOIN unidades und ON tsk.unidade_id = und.id
      WHERE h.usuario_id = ?
      GROUP BY 
        tsk.id, tpt.tipo, tsk.prioridade, tsk.status, tsk.setor_id, tsk.responsavel_id, tsk.unidade_id, tsk.prazo,
        emp.nome_fantasia, emp.razao_social, emp.cnpj, emp.cidade,
        usr_tarefa.nome, str.nome, und.nome
      ORDER BY ultima_alteracao DESC
      LIMIT ?
      `,
      [usuario_id, limit]
    )

    const response = {
      tasks: (rows as any[]).map(row => ({
        id: row.tarefa_id,
        empresa: row.empresa_nome,
        unidade: row.unidade_nome,
        finalidade: row.finalidade,
        status: row.status,
        prioridade: row.prioridade,
        setor: row.setor_nome,
        prazo: row.prazo,
        responsavel: row.responsavel_nome || 'Não atribuído',
        updatedAt: row.ultima_alteracao || null,
      })),
      total: (rows as any[]).length,
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Erro ao buscar tarefas recentes por usuário:', error)
    res.status(500).json({ message: 'Erro ao buscar tarefas' })
  }
}