import type { ReactElement } from 'react'
import { useState } from 'react'
import type { Proposal } from '@/services/proposals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconSearch, IconX } from '@tabler/icons-react'
import ProposalStatusBadge from '@/components/proposal-status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CommercialProposalsTable({ proposals = [] }: { proposals?: Proposal[] }): ReactElement {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedResp, setSelectedResp] = useState<string>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // derive filters
  const uniqueStatuses = Array.from(
    new Set(
      (proposals || [])
        .map((p) => (p?.status ?? '').toString().trim())
        .filter(Boolean)
    )
  )

  const uniqueResponsaveis = Array.from(
    new Set(
      (proposals as Array<Proposal & { responsavel?: string }>)
        .map((p) => (p as any).responsavel as string | undefined)
        .filter((v): v is string => !!v && v.trim().length > 0)
    )
  )

  // filtered + searched
  const filtered = (proposals as Array<Proposal & { titulo?: string; responsavel?: string }>)
    .filter((p) => {
      if (selectedStatus !== 'all') {
        const ps = (p.status ?? '').toString().toLowerCase()
        if (ps !== selectedStatus.toLowerCase()) return false
      }
      if (selectedResp !== 'all') {
        const pr = ((p as any).responsavel ?? '').toString().toLowerCase()
        if (pr !== selectedResp.toLowerCase()) return false
      }
      const q = search.trim().toLowerCase()
      if (q.length === 0) return true
  const titulo = (p.titulo ?? '').toString().toLowerCase()
  const cliente = (p.cliente ?? '').toString().toLowerCase()
      // Prefer match on título; fallback to cliente if título não existir
      return (titulo.length > 0 && titulo.includes(q)) || cliente.includes(q)
    })

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePageIndex = Math.min(Math.max(0, pageIndex), totalPages - 1)
  const pageItems = filtered.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)

  return (
    <div className="rounded-lg border bg-card mx-6">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-lg font-semibold">Propostas</h3>
      </div>
      <div className="px-4 pb-4">
        {/* Controls: search + filters */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Pesquisar título da proposta"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPageIndex(0) }}
              className="pr-8"
            />
            {search ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSearch(''); setPageIndex(0) }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
                aria-label="Limpar pesquisa"
              >
                <IconX />
              </Button>
            ) : (
              <IconSearch className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPageIndex(0) }}>
              <SelectTrigger className="w-44" id="proposal-status-filter">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {uniqueStatuses.map((s) => (
                  <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedResp} onValueChange={(v) => { setSelectedResp(v); setPageIndex(0) }}>
              <SelectTrigger className="w-48" id="proposal-resp-filter">
                <SelectValue placeholder="Todos responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos responsáveis</SelectItem>
                {uniqueResponsaveis.map((r) => (
                  <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data de Elaboração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 w-full text-center text-muted-foreground">
                  Nenhuma proposta encontrada
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((p) => (
                <TableRow key={p.id} className="align-top">
                  <TableCell>{p.titulo ?? '—'}</TableCell>
                  <TableCell>{p.responsavel ?? '—'}</TableCell>
                  <TableCell>{p.criadoEm ? new Date(p.criadoEm).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    <ProposalStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Linhas por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0) }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">Página {safePageIndex + 1} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPageIndex(0)} disabled={safePageIndex === 0}>{'<<'}</Button>
              <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={safePageIndex === 0}>{'<'}</Button>
              <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={safePageIndex >= totalPages - 1}>{'>'}</Button>
              <Button variant="outline" size="sm" onClick={() => setPageIndex(totalPages - 1)} disabled={safePageIndex >= totalPages - 1}>{'>>'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
