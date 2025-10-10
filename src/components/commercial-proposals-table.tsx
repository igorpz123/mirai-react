import React, { useState, useMemo, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconDotsVertical, IconRotateClockwise, IconExternalLink, IconLink, IconTrash } from '@tabler/icons-react'
import { toastError, toastSuccess } from '@/lib/customToast'
import { recalculateProposalTotal, deleteProposal, updateProposalStatus, PROPOSAL_STATUSES, type ProposalStatus, updateProposalPayment, PAYMENT_METHOD_OPTIONS } from '@/services/proposals'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { DropdownMenuLabel } from '@radix-ui/react-dropdown-menu'

export function CommercialProposalsTable({
  proposals = [],
  onProposalsPatched,
  onProposalDeleted,
}: {
  proposals?: Proposal[]
  onProposalsPatched?: (patches: Array<{ id: number | string; changes: Partial<Proposal> }>) => void
  onProposalDeleted?: (id: number | string) => void
}): ReactElement {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedResp, setSelectedResp] = useState<string>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState<Proposal[]>(proposals)

  // keep local rows in sync when proposals prop changes
  React.useEffect(() => { setRows(proposals) }, [proposals])

  // debounce search to avoid rerender/glitch on each keystroke
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150)
    return () => clearTimeout(t)
  }, [search])

  const isAdmin = useMemo(() => [1, 2, 3].includes(Number(user?.cargoId)), [user?.cargoId])

  const fmtBRL = (n: number | null | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0))

  // helpers: normalize and label statuses
  const canonicalizeStatus = (s: string): string => {
    const t = (s || '').toLowerCase().trim()
    switch (t) {
      case 'andamento':
      case 'em andamento':
      case 'progress':
        return 'progress'
      case 'analise':
      case 'análise':
      case 'em análise':
        return 'analise'
      case 'rejeitada':
      case 'recusada':
        return 'rejeitada'
      case 'aprovada':
        return 'aprovada'
      case 'pendente':
        return 'pendente'
      default:
        return t
    }
  }

  const statusLabel = (key: string): string => {
    switch (key) {
      case 'progress':
        return 'Em Andamento'
      case 'analise':
        return 'Em Análise'
      case 'pendente':
        return 'Pendente'
      case 'rejeitada':
        return 'Rejeitada'
      case 'aprovada':
        return 'Aprovada'
      default:
        return key
    }
  }

  // derive filters
  const uniqueStatuses = useMemo(() => (
    Array.from(
      new Set(
        (proposals || [])
          .map((p) => canonicalizeStatus((p?.status ?? '').toString()))
          .filter((v) => !!v)
      )
    )
  ), [proposals])

  const uniqueResponsaveis = useMemo(() => (
    Array.from(
      new Set(
        (proposals as Array<Proposal & { responsavel?: string }>)
          .map((p) => (p as any).responsavel as string | undefined)
          .filter((v): v is string => !!v && v.trim().length > 0)
      )
    )
  ), [proposals])

  // filtered + searched
  const filtered = useMemo(() => {
    const list = (rows as Array<Proposal & { titulo?: string; responsavel?: string }>)
    return list.filter((p) => {
      if (selectedStatus !== 'all') {
        const ps = canonicalizeStatus((p.status ?? '').toString())
        if (ps !== selectedStatus) return false
      }
      if (selectedResp !== 'all') {
        const pr = ((p as any).responsavel ?? '').toString().toLowerCase()
        if (pr !== selectedResp.toLowerCase()) return false
      }
      const q = debouncedSearch
      if (q.length === 0) return true
      const titulo = (p.titulo ?? '').toString().toLowerCase()
      const cliente = (p.cliente ?? '').toString().toLowerCase()
      return (titulo.length > 0 && titulo.includes(q)) || cliente.includes(q)
    })
  }, [rows, selectedStatus, selectedResp, debouncedSearch])

  // pagination
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const safePageIndex = useMemo(() => Math.min(Math.max(0, pageIndex), totalPages - 1), [pageIndex, totalPages])
  const pageItems = useMemo(() => filtered.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize), [filtered, safePageIndex, pageSize])

  const isUserResponsible = React.useCallback((p: Proposal) => {
    return (p as any).responsavel_id
      ? Number((p as any).responsavel_id) === Number(user?.id)
      : (p.responsavel ?? '').toString().toLowerCase() === `${user?.nome ?? ''}`.toLowerCase()
  }, [user?.id, user?.nome])

  const ProposalActionsMenu: React.FC<{
    p: Proposal
    onChange: (updater: (prev: Proposal[]) => Proposal[]) => void
  }>
    = React.memo(({ p, onChange }) => {
    const [open, setOpen] = useState(false)
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [savingPayment, setSavingPayment] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<string>('pix_mp')
    const [paymentInstallments, setPaymentInstallments] = useState<string>('1')
    const canManage = isAdmin || isUserResponsible(p)
    return (
      <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="data-[state=open]:bg-muted text-muted-foreground">
            <IconDotsVertical />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        {open && (
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={`/comercial/proposta/${p.id}`}>
                <IconExternalLink className="mr-2" /> Visualizar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                try {
                  const res = await recalculateProposalTotal(p.id)
                  onChange(prev => prev.map(r => r.id === p.id ? { ...r, valor_total: res.valor_total } : r))
                  onProposalsPatched?.([{ id: p.id as any, changes: { valor_total: res.valor_total } as Partial<Proposal> }])
                  toastSuccess('Valor total recalculado')
                } catch (err) {
                  toastError('Falha ao recalcular valor total')
                }
              }}
            >
              <IconRotateClockwise className="mr-2" /> Recalcular valor
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.origin + `/comercial/proposta/${p.id}`)
                  toastSuccess('Link copiado')
                } catch (e) {
                  toastError('Não foi possível copiar')
                }
              }}
            >
              <IconLink className="mr-2" /> Copiar link
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className='px-2 text-sm text-muted-foreground'>
                  Atualizar Status
                </DropdownMenuLabel>
                {PROPOSAL_STATUSES.map(s => (
                  <DropdownMenuItem
                    key={`status-${s.key}`}
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        if (s.key === 'aprovada') {
                          // Directly open dialog (no prior confirmation, no immediate status change)
                          setPaymentMethod((p as any).payment_method || 'pix_mp')
                          setPaymentInstallments(String((p as any).payment_installments || 1))
                          setOpen(false)
                          setPaymentOpen(true)
                          return
                        }
                        // Other statuses: keep normal flow (confirm only for rejeitada)
                        if (s.key === 'rejeitada') {
                          const ok = window.confirm(`Tem certeza que deseja marcar como ${s.label}?`)
                          if (!ok) return
                        }
                        const res = await updateProposalStatus(p.id, s.key as ProposalStatus)
                        onChange(prev => prev.map(r => r.id === p.id ? { ...r, status: res.status, dataAlteracao: (res as any).dataAlteracao ?? (r as any).dataAlteracao } : r))
                        onProposalsPatched?.([
                          { id: p.id as any, changes: { status: res.status, dataAlteracao: (res as any).dataAlteracao ?? (p as any).dataAlteracao } as Partial<Proposal> }
                        ])
                        toastSuccess(`O status da proposta foi atualizado para: ${s.label}`)
                      } catch (e: any) {
                        toastError(e?.response?.data?.message || 'Falha ao atualizar status')
                      }
                    }}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={async () => {
                    try {
                      const confirmed = window.confirm('Tem certeza que deseja deletar esta proposta?')
                      if (!confirmed) return
                      await deleteProposal(p.id)
                      onChange(prev => prev.filter(r => r.id !== p.id))
                      onProposalDeleted?.(p.id)
                      toastSuccess('Proposta deletada')
                    } catch (err) {
                      toastError('Falha ao deletar proposta')
                    }
                  }}
                >
                  <IconTrash className='mr-2 text-destructive' /> Deletar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        )}
  </DropdownMenu>
      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={(v)=>{ if(!savingPayment) setPaymentOpen(v) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Forma de pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`pay-method-${p.id}`}>Método</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id={`pay-method-${p.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`pay-inst-${p.id}`}>Parcelas</Label>
              <Input id={`pay-inst-${p.id}`} type="number" min={1} value={paymentInstallments} onChange={(e)=> setPaymentInstallments(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={()=> setPaymentOpen(false)} disabled={savingPayment}>Cancelar</Button>
            <Button onClick={async ()=>{
              try {
                setSavingPayment(true)
                const installments = Math.max(1, Number(paymentInstallments || '1'))
                // Save payment first
                const resp = await updateProposalPayment(p.id, { payment_method: paymentMethod as any, payment_installments: installments })
                onChange(prev => prev.map(r => r.id === p.id ? { ...r, payment_method: resp.payment_method, payment_installments: resp.payment_installments, dataAlteracao: (resp as any).dataAlteracao ?? (r as any).dataAlteracao } : r))
                onProposalsPatched?.([{ id: p.id as any, changes: { payment_method: resp.payment_method, payment_installments: resp.payment_installments } }])
                // Then set status to aprovada
                const statusRes = await updateProposalStatus(p.id, 'aprovada')
                onChange(prev => prev.map(r => r.id === p.id ? { ...r, status: statusRes.status, dataAlteracao: (statusRes as any).dataAlteracao ?? (r as any).dataAlteracao } : r))
                onProposalsPatched?.([{ id: p.id as any, changes: { status: statusRes.status, dataAlteracao: (statusRes as any).dataAlteracao } }])
                toastSuccess('Pagamento salvo e proposta aprovada')
                setPaymentOpen(false)
              } catch (e: any) {
                toastError(e?.response?.data?.message || 'Falha ao salvar pagamento')
              } finally {
                setSavingPayment(false)
              }
            }} disabled={savingPayment}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    )
  })

  const ProposalRow: React.FC<{ p: Proposal }> = React.memo(({ p }) => (
    <TableRow key={p.id} className="align-top" style={{ touchAction: 'manipulation' }}>
      <TableCell>{p.titulo ?? '—'}</TableCell>
      <TableCell>{p.responsavel ?? '—'}</TableCell>
      <TableCell>{p.criadoEm ? new Date(p.criadoEm).toLocaleDateString('pt-BR') : '—'}</TableCell>
      <TableCell>{(p.updatedAt || p.dataAlteracao) ? new Date((p.updatedAt || p.dataAlteracao) as string).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</TableCell>
      <TableCell>
        <ProposalStatusBadge status={p.status} />
      </TableCell>
      <TableCell>
        {fmtBRL(p.valor_total ?? p.valor ?? 0)}
      </TableCell>
      <TableCell>
        <ProposalActionsMenu p={p} onChange={setRows} />
      </TableCell>
    </TableRow>
  ))

  return (
    <div className="bg-transparent mx-6">
      {/* <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Button onClick={() => navigate('/comercial/proposta/nova')} className='button-primary'>Nova Proposta</Button>
      </div> */}
      <div className="p-4">
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
                  <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
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

        <Table className='border rounded-lg'>
          <TableHeader className="bg-card">
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data de Elaboração</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 w-full text-center text-muted-foreground">
                  Nenhuma proposta encontrada
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((p) => (
                <ProposalRow key={p.id} p={p} />
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
