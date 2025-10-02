import api from './api'
import jsPDF from 'jspdf'

export type ApprovedProposalReportItem = {
  id: number
  titulo: string | null
  valor_total: number
  comissao_vendedor: number
  indicacao_nome: string | null
  comissao_indicacao: number
  responsavel_id: number | null
  responsavel_nome: string | null
}

export async function getApprovedProposals(params?: { inicio?: string; fim?: string; userId?: string }): Promise<{ total: number; proposals: ApprovedProposalReportItem[] }> {
  const res = await api.get('/relatorios/propostas-aprovadas', { params })
  return res.data
}

export type NotasRankingItem = {
  posicao: number
  usuario_id: number
  nome: string
  quantidade: number
  media: number | null
}

export async function getNotasRanking(params?: { inicio?: string; fim?: string }): Promise<{ total: number; ranking: NotasRankingItem[] }> {
  const res = await api.get('/relatorios/ranking-notas', { params })
  return res.data
}

// Simple PDF exports
export async function exportApprovedProposalsToPdf(items: ApprovedProposalReportItem[], opts?: { title?: string; periodo?: string }): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  let y = margin
  const title = opts?.title || 'Propostas Aprovadas'
  const periodo = opts?.periodo ? `\n${opts.periodo}` : ''
  doc.setFontSize(16)
  doc.text(`${title}${periodo}`, margin, y)
  y += 24

  doc.setFontSize(10)
  // headers
  const headers = ['#', 'Título', 'Responsável', 'Valor Total', 'Comissão (Vend.)', 'Indicação', 'Comissão (Ind.)']
  // keep within page width (A4 ~595pt). margin 40 => usable ~515pt
  const colX = [margin, margin + 30, margin + 240, margin + 330, margin + 410, margin + 490, margin + 545]
  headers.forEach((h, i) => doc.text(h, colX[i], y))
  y += 14

  const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  let totValor = 0, totComVend = 0, totComInd = 0
  items.forEach((r) => {
    if (y > 780) { doc.addPage(); y = margin }
    doc.text(String(r.id), colX[0], y)
    const titulo = r.titulo || '-'
    doc.text(titulo.length > 30 ? titulo.slice(0, 27) + '...' : titulo, colX[1], y)
    doc.text(r.responsavel_nome || '-', colX[2], y)
    doc.text(fmtBRL(r.valor_total), colX[3], y, { align: 'left' })
    doc.text(fmtBRL(r.comissao_vendedor), colX[4], y)
    doc.text(r.indicacao_nome || '-', colX[5], y)
    doc.text(fmtBRL(r.comissao_indicacao), colX[6], y)
    totValor += r.valor_total || 0
    totComVend += r.comissao_vendedor || 0
    totComInd += r.comissao_indicacao || 0
    y += 14
  })

  // Totals footer
  if (items.length > 0) {
    if (y > 760) { doc.addPage(); y = margin }
    doc.setFont('helvetica', 'bold')
    doc.text('Totais', colX[2], y)
    doc.text(fmtBRL(totValor), colX[3], y)
    doc.text(fmtBRL(totComVend), colX[4], y)
    doc.text('-', colX[5], y)
    doc.text(fmtBRL(totComInd), colX[6], y)
    doc.setFont('helvetica', 'normal')
  }

  return doc.output('blob')
}

export async function exportNotasRankingToPdf(items: NotasRankingItem[], opts?: { title?: string; periodo?: string }): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  let y = margin
  const title = opts?.title || 'Ranking de Notas'
  const periodo = opts?.periodo ? `\n${opts.periodo}` : ''
  doc.setFontSize(16)
  doc.text(`${title}${periodo}`, margin, y)
  y += 24

  doc.setFontSize(10)
  const headers = ['Posição', 'Nome', 'Qtd', 'Média']
  const colX = [margin, margin + 80, margin + 420, margin + 480]
  headers.forEach((h, i) => doc.text(h, colX[i], y))
  y += 14

  items.forEach((r) => {
    if (y > 780) { doc.addPage(); y = margin }
    doc.text(String(r.posicao), colX[0], y)
    doc.text(r.nome, colX[1], y)
    doc.text(String(r.quantidade), colX[2], y)
    doc.text(r.media != null ? r.media.toFixed(2) : '-', colX[3], y)
    y += 14
  })

  return doc.output('blob')
}

export default { getApprovedProposals, getNotasRanking, exportApprovedProposalsToPdf, exportNotasRankingToPdf }
