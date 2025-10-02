import api from './api'
import jsPDF from 'jspdf'

export type ApprovedProposalReportItem = {
  id: number
  titulo: string | null
  payment_method: string | null
  valor_total: number
  comissao_vendedor: number
  indicacao_nome: string | null
  comissao_indicacao: number
  responsavel_id: number | null
  responsavel_nome: string | null
}

export async function getApprovedProposals(params?: { inicio?: string; fim?: string; userId?: string; paymentMethod?: string }): Promise<{ total: number; proposals: ApprovedProposalReportItem[] }> {
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
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const margin = 40
  let y = margin
  const title = opts?.title || 'Propostas Aprovadas'
  const periodo = opts?.periodo ? `\n${opts.periodo}` : ''
  doc.setFontSize(16)
  doc.text(`${title}${periodo}`, margin, y)
  y += 24

  doc.setFontSize(10)
  // headers
  const headers = ['#', 'Título', 'Responsável', 'Pagamento', 'Valor Total', 'Comissão (Vend. 5%/7%)', 'Indicação', 'Comissão (Ind. 2%)']
  // landscape width ~842pt, usable ~762pt
  const colX = [margin, margin + 30, margin + 250, margin + 360, margin + 450, margin + 540, margin + 640, margin + 740]
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
  doc.text(formatPaymentMethod(r.payment_method), colX[3], y)
    doc.text(fmtBRL(r.valor_total), colX[4], y, { align: 'left' })
    doc.text(fmtBRL(r.comissao_vendedor), colX[5], y)
    doc.text(r.indicacao_nome || '-', colX[6], y)
    doc.text(fmtBRL(r.comissao_indicacao), colX[7], y)
    totValor += r.valor_total || 0
    totComVend += r.comissao_vendedor || 0
    totComInd += r.comissao_indicacao || 0
    y += 14
  })

  // Totals footer
  if (items.length > 0) {
    if (y > 760) { doc.addPage(); y = margin }
    doc.setFont('helvetica', 'bold')
    doc.text('Totais', colX[3], y)
    doc.text(fmtBRL(totValor), colX[4], y)
    doc.text(fmtBRL(totComVend), colX[5], y)
    doc.text('-', colX[6], y)
    doc.text(fmtBRL(totComInd), colX[7], y)
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

export function formatPaymentMethod(pm: string | null | undefined): string {
  const v = (pm || '').toString().trim()
  switch (v) {
    case 'financeiro_boleto':
      return 'Financeiro'
    case 'pix_mp':
      return 'Mercado Pago (PIX)'
    case 'boleto_mp':
      return 'Mercado Pago (Boleto)'
    default:
      return v || '-'
  }
}

// CSV helpers (Excel-friendly)
function escapeCSV(val: any): string {
  const s = val == null ? '' : String(val)
  if (/[",\n;]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function exportApprovedProposalsToCsv(items: ApprovedProposalReportItem[], opts?: { title?: string; periodo?: string }): Blob {
  const headers = ['Nº Proposta', 'Título', 'Responsável', 'Pagamento', 'Valor Total', 'Comissão (Vend. 5%/7%)', 'Indicação', 'Comissão (Ind. 2%)']
  const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const lines: string[] = []
  // Optional title/periodo as commented header rows
  if (opts?.title) lines.push(`# ${opts.title}`)
  if (opts?.periodo) lines.push(`# ${opts.periodo}`)
  if (lines.length) lines.push('') // blank line
  lines.push(headers.map(h => escapeCSV(h)).join(','))
  let totValor = 0, totComVend = 0, totComInd = 0
  for (const r of items) {
    totValor += r.valor_total || 0
    totComVend += r.comissao_vendedor || 0
    totComInd += r.comissao_indicacao || 0
    lines.push([
      escapeCSV(r.id),
      escapeCSV(r.titulo || '-'),
      escapeCSV(r.responsavel_nome || '-'),
      escapeCSV(formatPaymentMethod(r.payment_method)),
      escapeCSV(fmtBRL(r.valor_total)),
      escapeCSV(fmtBRL(r.comissao_vendedor)),
      escapeCSV(r.indicacao_nome || '-'),
      escapeCSV(fmtBRL(r.comissao_indicacao)),
    ].join(','))
  }
  if (items.length > 0) {
    lines.push(['', 'Totais', '', '', fmtBRL(totValor), fmtBRL(totComVend), '', fmtBRL(totComInd)].map(escapeCSV).join(','))
  }
  const csv = lines.join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export function exportApprovedProposalsToExcel(items: ApprovedProposalReportItem[], opts?: { title?: string; periodo?: string }): Blob {
  const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  let totValor = 0, totComVend = 0, totComInd = 0
  const escapeHtml = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const head = `
    <tr>
      <th>Nº Proposta</th>
      <th>Título</th>
      <th>Responsável</th>
      <th>Pagamento</th>
      <th>Valor Total</th>
      <th>Comissão (Vend. 5%/7%)</th>
      <th>Indicação</th>
      <th>Comissão (Ind. 2%)</th>
    </tr>`
  const rows = items.map(r => {
    totValor += r.valor_total || 0
    totComVend += r.comissao_vendedor || 0
    totComInd += r.comissao_indicacao || 0
    return `
      <tr>
        <td>${escapeHtml(r.id)}</td>
        <td>${escapeHtml(r.titulo || '-')}</td>
        <td>${escapeHtml(r.responsavel_nome || '-')}</td>
        <td>${escapeHtml(formatPaymentMethod(r.payment_method))}</td>
        <td>${escapeHtml(fmtBRL(r.valor_total))}</td>
        <td>${escapeHtml(fmtBRL(r.comissao_vendedor))}</td>
        <td>${escapeHtml(r.indicacao_nome || '-')}</td>
        <td>${escapeHtml(fmtBRL(r.comissao_indicacao))}</td>
      </tr>`
  }).join('')
  const totalsRow = items.length > 0 ? `
    <tr>
      <td></td>
      <td><b>Totais</b></td>
      <td></td>
      <td></td>
      <td><b>${escapeHtml(fmtBRL(totValor))}</b></td>
      <td><b>${escapeHtml(fmtBRL(totComVend))}</b></td>
      <td></td>
      <td><b>${escapeHtml(fmtBRL(totComInd))}</b></td>
    </tr>` : ''

  const title = opts?.title ? `<h3>${escapeHtml(opts.title)}</h3>` : ''
  const periodo = opts?.periodo ? `<div>${escapeHtml(opts.periodo)}</div>` : ''
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        ${title}
        ${periodo}
        <table border="1" cellspacing="0" cellpadding="4">
          <thead>${head}</thead>
          <tbody>${rows}</tbody>
          <tfoot>${totalsRow}</tfoot>
        </table>
      </body>
    </html>`
  return new Blob([html], { type: 'application/vnd.ms-excel' })
}
