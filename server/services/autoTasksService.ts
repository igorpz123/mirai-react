import pool from '../config/db'
import { RowDataPacket, OkPacket } from 'mysql2'

type EmpresaRow = RowDataPacket & {
  id: number
  unidade_responsavel: number | null
  periodicidade: number | null
  data_renovacao: string | null
  tecnico_responsavel: number | null
  razao_social: string | null
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d.getTime())
  n.setDate(n.getDate() + days)
  return n
}

export async function generateAutomaticTasksForCompany(
  empresaId: number,
  options: { futureYears?: number } = {}
): Promise<{ created: number }> {
  const { futureYears = 0 } = options
  
  // Load empresa data
  const [rows] = await pool.query<EmpresaRow[]>(
    `SELECT id, unidade_responsavel, periodicidade, data_renovacao, tecnico_responsavel, razao_social FROM empresas WHERE id = ? LIMIT 1`,
    [empresaId]
  )
  if (!rows || rows.length === 0) return { created: 0 }
  const emp = rows[0]

  // Validate required fields
  if (!emp.data_renovacao) return { created: 0 }
  const periodicidade = emp.periodicidade ? Number(emp.periodicidade) : null
  if (!periodicidade || periodicidade <= 0) {
    // Without periodicidade we can still create initial/renewal task
  }

  const unidadeId = emp.unidade_responsavel ? Number(emp.unidade_responsavel) : null
  const tecnicoId = emp.tecnico_responsavel ? Number(emp.tecnico_responsavel) : null
  const nomeEmpresa = emp.razao_social || 'Empresa'

  const now = new Date()
  const anoAtual = now.getFullYear()
  const dataRenovacaoBase = new Date(emp.data_renovacao as any)
  if (isNaN(dataRenovacaoBase.getTime())) return { created: 0 }
  const anoRenovacao = dataRenovacaoBase.getFullYear()

  let createdCount = 0
  const eventosRegistrados = new Set<string>()

  // Gerar tarefas para o ano atual + anos futuros solicitados
  const anosParaGerar = [anoAtual]
  for (let i = 1; i <= futureYears; i++) {
    anosParaGerar.push(anoAtual + i)
  }

  for (const ano of anosParaGerar) {
    // Define tarefa principal (Inspeção Inicial vs Renovação)
    let tipoTarefa = 2 // Renovação
    let dataEvento = new Date(ano, dataRenovacaoBase.getMonth(), dataRenovacaoBase.getDate())
    let tipoTarefaTexto = 'Renovação'
    let corEvento = 'rgb(167 150 0)'
    let horaInicio = '13:00:00'
    let horaFim = '14:00:00'

    if (anoRenovacao === ano) {
      tipoTarefa = 1 // Inspeção Inicial
      tipoTarefaTexto = 'Inspeção Inicial'
    }

    const prazo = formatDate(dataEvento)
    let tarefaPrincipalCriada = false
    
    // Evitar duplicidade exatamente na mesma data para a empresa
    {
      const [existsRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM tarefas WHERE prazo = ? AND empresa_id = ?`,
        [prazo, empresaId]
      )
      const exists = Number((existsRows as any)[0]?.cnt || 0)
      if (exists === 0) {
        const [ins] = await pool.query<OkPacket>(
          `INSERT INTO tarefas (empresa_id, finalidade_id, prioridade, status, prazo, setor_id, responsavel_id, created_at, created_by, unidade_id)
           VALUES (?, ?, 'Normal', 'Automático', ?, 2, ?, NOW(), 1, ?)`,
          [empresaId, tipoTarefa, prazo, tecnicoId, unidadeId]
        )
        const tarefaId = (ins as any).insertId
        await pool.query<OkPacket>(
          `INSERT INTO agenda_events (title, description, color, start, end, tarefa_id, usuario_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `${tipoTarefaTexto} (${nomeEmpresa})`,
            `${tipoTarefaTexto} a ser realizada na empresa ${nomeEmpresa}`,
            corEvento,
            `${prazo} ${horaInicio}`,
            `${prazo} ${horaFim}`,
            tarefaId,
            tecnicoId,
          ]
        )
        createdCount++
        tarefaPrincipalCriada = true
      }
      // Sempre registrar o evento principal, mesmo se já existia
      eventosRegistrados.add(prazo)
    }

    // Rotinas baseadas em periodicidade para o ano específico
    if (periodicidade && periodicidade > 0) {
      const inicioAno = new Date(ano, 0, 1)
      const fimAno = new Date(ano, 11, 31)

      // Encontrar a primeira data de rotina >= início do ano e alinhada pela periodicidade em relação ao anchor (dataEvento)
      // Retrocede em passos de periodicidade até ficar <= início do ano, depois avança até >= início do ano
      let candidato = new Date(dataEvento.getTime())
      const periodMs = periodicidade * 24 * 60 * 60 * 1000
      while (candidato.getTime() - inicioAno.getTime() >= periodMs) {
        candidato = addDays(candidato, -periodicidade)
      }
      while (candidato < inicioAno) {
        candidato = addDays(candidato, periodicidade)
      }

      let dataRotina = new Date(candidato.getTime())
      const primaryMs = dataEvento.getTime()
      const THIRTEEN_DAYS = 13 * 24 * 60 * 60 * 1000

      while (dataRotina.getTime() <= fimAno.getTime()) {
        const prazoRotina = formatDate(dataRotina)
        
        // pular janelas ±13 dias do evento principal
        if (Math.abs(dataRotina.getTime() - primaryMs) <= THIRTEEN_DAYS) {
          dataRotina = addDays(dataRotina, periodicidade)
          continue
        }
        
        // Verificar se a data já foi registrada nesta execução
        if (eventosRegistrados.has(prazoRotina)) {
          dataRotina = addDays(dataRotina, periodicidade)
          continue
        }
        
        // Verificar se alguma data registrada nesta execução está dentro da janela de 13 dias
        let dentroJanelaRegistrada = false
        for (const dataRegistrada of eventosRegistrados) {
          const diffMs = Math.abs(dataRotina.getTime() - new Date(dataRegistrada).getTime())
          if (diffMs <= THIRTEEN_DAYS) {
            dentroJanelaRegistrada = true
            break
          }
        }
        
        if (dentroJanelaRegistrada) {
          dataRotina = addDays(dataRotina, periodicidade)
          continue
        }
        
        // evitar duplicidade numa janela de 13 dias vs quaisquer tarefas existentes no banco
        const [existRows] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) as cnt FROM tarefas WHERE empresa_id = ? AND ABS(DATEDIFF(prazo, ?)) <= 13`,
          [empresaId, prazoRotina]
        )
        const exists = Number((existRows as any)[0]?.cnt || 0)
        if (exists === 0) {
          const [ins2] = await pool.query<OkPacket>(
            `INSERT INTO tarefas (empresa_id, finalidade_id, prioridade, status, prazo, setor_id, responsavel_id, created_at, created_by, unidade_id)
             VALUES (?, 4, 'Normal', 'Automático', ?, 2, ?, NOW(), 1, ?)`,
            [empresaId, prazoRotina, tecnicoId, unidadeId]
          )
          const tarefaId2 = (ins2 as any).insertId
          await pool.query<OkPacket>(
            `INSERT INTO agenda_events (title, description, color, start, end, tarefa_id, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              `Rotina (${nomeEmpresa})`,
              `Rotina a ser realizada na empresa ${nomeEmpresa}`,
              'rgb(1 120 90)',
              `${prazoRotina} 08:00:00`,
              `${prazoRotina} 08:30:00`,
              tarefaId2,
              tecnicoId,
            ]
          )
          createdCount++
          eventosRegistrados.add(prazoRotina)
        }
        
        dataRotina = addDays(dataRotina, periodicidade)
      }
    }
  } // Fecha o loop de anos

  return { created: createdCount }
}

// Remove todas as tarefas automáticas (status='Automático') e seus eventos de agenda para a empresa
export async function purgeAutomaticTasksForCompany(empresaId: number): Promise<{ deleted: number }> {
  // Capturar ids de tarefas automáticas
  const [taskRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tarefas WHERE empresa_id = ? AND status = 'Automático'`,
    [empresaId]
  )
  if (!taskRows || taskRows.length === 0) return { deleted: 0 }
  const ids = (taskRows as any[]).map(r => r.id)
  // Apagar eventos primeiro
  await pool.query(`DELETE FROM agenda_events WHERE tarefa_id IN (${ids.map(() => '?').join(',')})`, ids)
  // Apagar tarefas
  const [del] = await pool.query<OkPacket>(`DELETE FROM tarefas WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
  return { deleted: Number((del as any).affectedRows || 0) }
}
