import * as React from "react"
import { useState } from "react"
import type { Task } from "../services/tasks"
import { getUsersByDepartmentAndUnit, getUsersByUnitId, getAllUsers } from '@/services/users';
import { updateTask as updateTaskService, deleteTask as deleteTaskService } from '@/services/tasks'
import type { User } from '@/services/users';
import { useUsers } from '@/contexts/UsersContext';
import { useUnit } from '@/contexts/UnitContext';
import { useTheme } from '@/components/layout/theme-provider';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconSearch,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

// Badge now rendered via TaskStatusBadge component
import TaskStatusBadge from '@/components/task-status-badge'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from 'react-router-dom'
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { TaskInfo } from "@/components/technical-task-info";
import { toastSuccess, toastWarning, toastError } from '@/lib/customToast'
import { useAuth } from '@/contexts/AuthContext'

interface TableTask {
  id: number
  empresa: string
  unidade: string
  finalidade: string
  status: string
  prioridade: string
  setor: string
  setorId?: number
  unidadeId?: number
  responsavelId?: number | null
  prazo: string
  limit: string
  responsavel: string
  updatedAt?: string | null
}

interface TechnicalTaskTableProps {
  tasks: Task[]
  onRefresh?: () => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTasksReorder?: (taskIds: string[]) => Promise<void>
}

export const schema = z.object({
  id: z.number(),
  empresa: z.string(),
  unidade: z.string(),
  finalidade: z.string(),
  status: z.string(),
  prioridade: z.string(),
  setor: z.string(),
  prazo: z.string(),
  limit: z.string(),
  responsavel: z.string(),
  // responsavelId is optional and may be present in raw data
  responsavelId: z.number().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
})

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('pt-BR')

const formatDateTime = (dateString: string): string =>
  new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const getStatusText = (status: string): string => {
  switch (status) {
    case 'progress':
      return 'Em Andamento'
    case 'concluída':
      return 'Concluída'
    case 'pendente':
      return 'Pendente'
    default:
      return status
  }
}

// Create a separate component for the drag handle
const DragHandle: React.FC = React.memo(function DragHandleInner() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-grab"
      tabIndex={-1}
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Arraste para ordenar</span>
    </Button>
  )
})

// columns moved inside component so we can access component props/state

const DraggableRow: React.FC<{ row: Row<z.infer<typeof schema>> }> = React.memo(function DraggableRowInner({ row }) {
  const { attributes, listeners, transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original.id })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      // Apply DnD listeners/attributes to the whole row (with activation constraint, clicks won't drag)
      {...attributes}
      {...listeners}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
        touchAction: 'manipulation',
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
})

export const TechnicalTaskTable: React.FC<TechnicalTaskTableProps> = ({
  tasks,
  onRefresh,
  onTaskUpdate,
  onTasksReorder,
}) => {
  const { user } = useAuth()
  const isAdmin = React.useMemo(() => {
    const cid = Number((user as any)?.cargoId)
    return [1, 2, 3].includes(cid)
  }, [user])
  const { unitId } = useUnit();
  // local handler to update a single task in the table's data
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      setData(prev => prev.map(d => d.id.toString() === taskId ? { ...d, ...(updates as any) } : d))
      // notify parent if provided
      if (onTaskUpdate) await onTaskUpdate(taskId, updates)
      // optionally call external refresh callback
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Erro ao atualizar task localmente:', err)
    }
  }

  function ResponsibleSelect({ task }: { task: TableTask }) {
  const [users, setUsers] = React.useState<User[] | null>(null)
  const [loadingUsers, setLoadingUsers] = React.useState(false)
  const [errorUsers, setErrorUsers] = React.useState<string | null>(null)
  const [debugEndpoint, setDebugEndpoint] = React.useState<string | null>(null)
  const [lastRawData, setLastRawData] = React.useState<any | null>(null)
  const usersCtx = useUsers()
    const [assigning, setAssigning] = React.useState(false)
    // track last ensured unit to avoid calling ensureUsersForUnit repeatedly
    const lastEnsuredUnitRef = React.useRef<number | null | undefined>(undefined)

    React.useEffect(() => {
      let mounted = true
      ;(async () => {
        setLoadingUsers(true)
        try {
          // ensure ctx has users for the unit, but only call ensureUsersForUnit
          // again if the unit changed. This prevents repeated network/cache ops
          // when the context identity changes.
          const preferredUnit = task.unidadeId ?? unitId ?? null
          if (lastEnsuredUnitRef.current !== preferredUnit) {
            await usersCtx.ensureUsersForUnit(preferredUnit ?? null)
            lastEnsuredUnitRef.current = preferredUnit
          }

          if (!mounted) return
          const { users: fetched, error } = usersCtx.getFilteredUsersForTask({ setorId: task.setorId ?? undefined, setorName: task.setor ?? undefined, unidadeId: task.unidadeId ?? undefined })
          if (!mounted) return

          // if the context returned empty, attempt a direct API fallback
          let finalList = fetched || []

          // 1) If filtered by setor returned vazio, tentar só por unidade
          if ((finalList.length === 0) && (preferredUnit != null)) {
            const onlyUnit = usersCtx.getFilteredUsersForTask({ unidadeId: preferredUnit }).users || []
            if (onlyUnit.length > 0) {
              finalList = onlyUnit
            }
          }

          // 2) Se ainda vazio, tenta todos (sem filtros)
          if (finalList.length === 0) {
            const all = usersCtx.getFilteredUsersForTask({}).users || []
            if (all.length > 0) {
              finalList = all
            }
          }

          // 3) Como último recurso, tenta API específica (se tivermos setor E unidade id)
          if ((finalList.length === 0 || !finalList) && (task.setorId != null) && (preferredUnit != null)) {
            try {
              const res = await getUsersByDepartmentAndUnit(Number(task.setorId), Number(preferredUnit))
              if (mounted && res && Array.isArray(res.users) && res.users.length > 0) {
                finalList = res.users as User[]
                setLastRawData(res)
                setDebugEndpoint(`api:unit:${preferredUnit}`)
              }
            } catch (apiErr: any) {
              // surface API error so UI shows reason for empty list (e.g., 401)
              const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
              if (mounted) setErrorUsers(msg)
              console.warn('[ResponsibleSelect] fallback API call failed', apiErr)
            }
          }

          // 4) Se ainda vazio e temos unidade, tenta API por unidade
          if ((finalList.length === 0 || !finalList) && (preferredUnit != null)) {
            try {
              const res = await getUsersByUnitId(Number(preferredUnit))
              if (mounted && res && Array.isArray(res.users) && res.users.length > 0) {
                finalList = res.users as User[]
                setLastRawData(res)
                setDebugEndpoint(`api:unit-only:${preferredUnit}`)
              }
            } catch (apiErr: any) {
              const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
              if (mounted) setErrorUsers(msg)
              console.warn('[ResponsibleSelect] fallback unit API failed', apiErr)
            }
          }

          // 5) Como último recurso absoluto, busca todos usuários no servidor
          if ((finalList.length === 0 || !finalList)) {
            try {
              const res = await getAllUsers()
              if (mounted && res && Array.isArray(res.users) && res.users.length > 0) {
                finalList = res.users as User[]
                setLastRawData(res)
                setDebugEndpoint('api:all')
              }
            } catch (apiErr: any) {
              const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
              if (mounted) setErrorUsers(msg)
              console.warn('[ResponsibleSelect] fallback all-users API failed', apiErr)
            }
          }

          // avoid setting state if nothing changed to prevent re-renders that
          // might re-trigger effects in other components
          const normalizedFetched = finalList || []
          const same = Array.isArray(normalizedFetched) && Array.isArray(users) && normalizedFetched.length === users.length && normalizedFetched.every((u, i) => u.id === (users as User[])[i]?.id)
          if (!same) setUsers(normalizedFetched)
          setErrorUsers(error ?? null)
          setDebugEndpoint(preferredUnit ? `unit:${preferredUnit}` : 'all')
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários'
          if (!mounted) return
          setErrorUsers(msg)
          setUsers([])
        } finally {
          if (mounted) setLoadingUsers(false)
        }
      })()
      return () => { mounted = false }
    // only re-run when the logical inputs change (setorId/unitId/task.unit)
    }, [task.setorId, task.unidadeId, unitId, task.setor])

    const handleAssign = async (userIdValue: string) => {
      const userId = Number(userIdValue)
      // ignore placeholder/invalid selections
      if (userIdValue === '__none') return
      if (!userId || Number.isNaN(userId)) return

      const selectedUser = users?.find(u => u.id === userId)

      try {
        setAssigning(true)
        const shouldSetPending = String(task.status) === 'Automático'
        await updateTaskService(Number(task.id), { usuarioId: userId, ...(shouldSetPending ? { status: 'pendente' } : {}) })

        try { toastSuccess(shouldSetPending ? 'Responsável designado e tarefa marcada como pendente' : 'Responsável atribuído com sucesso') } catch (e) { /* ignore */ }

        // Atualiza UI local imediatamente
        setData(prev => prev.map(d => d.id === task.id ? { ...d, responsavel: selectedUser ? selectedUser.nome : d.responsavel, responsavelId: userId, status: shouldSetPending ? 'pendente' : d.status } : d))

        // chama callback externo se houver
        if (onRefresh) onRefresh()
        if (onTaskUpdate) {
          // notifies parent if it wants to persist changes locais
          onTaskUpdate(String(task.id), { responsavel: selectedUser ? selectedUser.nome : undefined, status: shouldSetPending ? 'pendente' : undefined } as Partial<Task>)
        }
      } catch (err) {
        console.error('Erro ao atribuir responsável:', err)
        try { toastError('Falha ao atribuir responsável à tarefa') } catch {}
      } finally {
        setAssigning(false)
      }
    }

    if (loadingUsers) {
      return <span>Carregando...</span>
    }

    if (errorUsers) {
      return <span className="text-destructive">{errorUsers}</span>
    }

    // filter users to only those with valid numeric ids to avoid duplicate/undefined keys
    const validUsers = (users || []).filter(u => u && (u.id !== undefined && u.id !== null) && !Number.isNaN(Number(u.id)))

    return (
      <Select onValueChange={handleAssign} defaultValue={typeof task.responsavelId === 'number' ? String(task.responsavelId) : undefined}>
        <SelectTrigger
          disabled={assigning}
          className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
          size="sm"
          id={`${task.id}-responsavel`}
        >
          <SelectValue placeholder={assigning ? 'Atribuindo...' : (task.responsavel && task.responsavel !== 'Não atribuído' ? task.responsavel : 'Designar Responsável')} />
        </SelectTrigger>
        <SelectContent align="end">
          {validUsers && validUsers.length > 0 ? (
            validUsers.map((u) => (
              <SelectItem key={String(u.id)} value={`${u.id}`}>
                {u.nome}
              </SelectItem>
            ))
          ) : (
            <>
              <SelectItem value="__none" disabled>Nenhum usuário</SelectItem>
              {debugEndpoint ? (
                <div className="px-2 py-1 text-xs text-muted-foreground">Origem: {debugEndpoint}</div>
              ) : null}
              {lastRawData ? (
                <pre className="text-xs max-h-40 overflow-auto bg-muted p-2 rounded mt-1">{JSON.stringify(lastRawData, null, 2)}</pre>
              ) : null}
            </>
          )}
        </SelectContent>
      </Select>
    )
  }
  const tableData = React.useMemo<TableTask[]>(() =>
    tasks.map(task => ({
      id: typeof task.id === 'string' ? parseInt(task.id) : task.id,
      empresa: task.empresa || 'N/A',
      unidade: task.unidade || 'N/A',
      finalidade: task.finalidade || 'Sem finalidade',
      status: task.status || 'pending',
      prioridade: task.prioridade || 'medium',
      setor: task.setor || 'Geral',
      setorId: (task as any).setorId || (task as any).setor_id || undefined,
      unidadeId: (task as any).unidadeId || (task as any).unidade_id || undefined,
      // try to preserve responsible user id if backend provides it
  responsavelId: (task as any).responsavel_id ?? (task as any).usuario_id ?? (task as any).usuarioId ?? (task as any).responsavelId ?? undefined,
      prazo: task.prazo || '',
      limit: task.prazo || '',
      responsavel: task.responsavel || 'Não atribuído',
      updatedAt: (task as any).updatedAt ?? (task as any).dataAlteracao ?? null,
    })),
    [tasks]
  )
  // CORREÇÃO 1: Usar tasks das props ao invés de initialData
  const [data, setData] = React.useState<TableTask[]>(tableData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [bulkWorking, setBulkWorking] = React.useState(false)
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {})
  )

  // View selector state: controls which 'finalidade' is shown
  const [selectedView, setSelectedView] = React.useState<string>('outline')

  // Company search state
  const [companyQuery, setCompanyQuery] = React.useState<string>('')

  // Status filter state
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all')

  // Compute available finalidades from the original tasks prop (more reliable)
  const uniqueFinalidades = React.useMemo(() => {
    const source = tasks || []
    const list = source
      .map(t => ((t.finalidade ?? '') as string).toString().trim() || 'Sem finalidade')
      .filter(Boolean)
    return Array.from(new Set(list))
  }, [tasks])

  // determine effective theme (dark mode) to style native option elements
  const { theme: chosenTheme } = useTheme()
  const isDark = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    if (chosenTheme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return chosenTheme === 'dark'
  }, [chosenTheme])

  const uniqueStatuses = React.useMemo(() => {
    const source = data || tableData || []
    const list = source
      .map(t => (t.status ?? '').toString().trim())
      .filter(Boolean)
    return Array.from(new Set(list))
  }, [data, tableData])

  // If selectedView becomes invalid (e.g. tasks changed), reset to 'outline'
  React.useEffect(() => {
    if (selectedView !== 'outline' && !uniqueFinalidades.includes(selectedView)) {
      setSelectedView('outline')
    }
  }, [uniqueFinalidades, selectedView])

  // If selectedStatus becomes invalid (e.g. tasks changed), reset to 'all'
  React.useEffect(() => {
    if (selectedStatus !== 'all' && !uniqueStatuses.includes(selectedStatus)) {
      setSelectedStatus('all')
    }
  }, [uniqueStatuses, selectedStatus])

  // Debug info to help when no finalidades appear
  React.useEffect(() => {
    console.debug('[TechnicalTaskTable] tasks count', { tasksLength: tasks?.length, tableDataLength: tableData?.length, uniqueFinalidades })
  }, [tasks, tableData, uniqueFinalidades])

  React.useEffect(() => {
    setData(tableData)
  }, [tableData])

  const columns: ColumnDef<z.infer<typeof schema>>[] = React.useMemo(() => [
    {
      id: "drag",
      header: () => null,
      cell: () => <DragHandle />,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "empresa",
      header: "Empresa",
      cell: ({ row }) => {
        return <span className="font-medium pl-2">{row.original.empresa}</span>
      },
      enableHiding: false,
    },
    {
      accessorKey: "finalidade",
      header: () => <div className="w-full text-left">Finalidade</div>,
      cell: ({ row }) => {
        return (
          <span className="pl-2">{row.original.finalidade}</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return <TaskStatusBadge status={status} />
      },
    },
    {
      accessorKey: "prazo",
      header: () => <div className="w-full text-left">Prazo</div>,
      cell: ({ row }) => {
        return (
          <span className="pl-2">{formatDate(row.original.prazo)}</span>
        )
      },
    },
    {
      accessorKey: "responsavel",
      header: "Responsável",
      cell: ({ row }) => {
        const isAssigned = row.original.responsavel !== "Não atribuído"
        const isAutomatic = String(row.original.status) === 'Automático'

        if (isAutomatic) {
          return (
            <>
              <Label htmlFor={`${row.original.id}-responsavel`} className="sr-only">Responsável</Label>
              <ResponsibleSelect task={row.original} />
            </>
          )
        }

        if (isAssigned) {
          return row.original.responsavel
        }

        return (
          <>
            <Label htmlFor={`${row.original.id}-responsavel`} className="sr-only">
              Responsável
            </Label>
            <ResponsibleSelect task={row.original} />
          </>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      header: () => <div className="w-full text-left">Atualizado</div>,
      cell: ({ row }) => {
        const v = row.original.updatedAt
        return v ? <span className="pl-2">{formatDateTime(v)}</span> : <span className="pl-2 text-muted-foreground">—</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const [sheetOpen, setSheetOpen] = useState(false)
        const {
          id,
          unidade,
          empresa,
          finalidade,
          prioridade,
          setor,
          responsavel,
        } = row.original

  const prazo = formatDate(row.original.prazo);

        const doDelete = async () => {
          const taskId = Number(id)
          if (!isAdmin) return
          const confirmed = window.confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')
          if (!confirmed) return
          try {
            await deleteTaskService(taskId)
            // remove from local table
            setData(prev => prev.filter(t => t.id !== taskId))
            try { toastSuccess('Tarefa deletada com sucesso') } catch {}
            if (onRefresh) onRefresh()
          } catch (err) {
            console.error('Erro ao deletar tarefa:', err)
            try { toastError('Falha ao deletar tarefa') } catch {}
          }
        }

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="data-[state=open]:bg-muted text-muted-foreground"
                >
                  <IconDotsVertical />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()    // evita bubbling
                    setSheetOpen(true)     // abre nosso sheet controlado
                  }}
                  className="cursor-pointer"
                >
                  Resumo
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to={`/technical/tarefa/${id}`}>
                    Visualizar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Favoritar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (isAdmin) doDelete() }} disabled={!isAdmin} className={!isAdmin ? 'opacity-60 pointer-events-none' : ''}>Deletar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Renderizamos o Sheet fora do DropdownMenu */}
            <TaskInfo
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              id={String(id)}
              unidade={unidade}
              empresa={empresa}
              finalidade={finalidade}
              prazo={prazo}
              status={row.original.status}
              prioridade={prioridade}
              setor={setor}
              responsavel={responsavel}
              responsavelId={row.original.responsavelId}
              onRefresh={onRefresh}
              onTaskUpdate={handleTaskUpdate}
            />
          </>
        )
      },
    },
  ], [handleTaskUpdate, onRefresh])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  // displayedData is derived from current data and selectedView + selectedStatus
  const displayedData = React.useMemo(() => {
    let out = data || []
    if (selectedView !== 'outline') {
      out = out.filter(d => d.finalidade === selectedView)
    }
    if (selectedStatus && selectedStatus !== 'all') {
      out = out.filter(d => (d.status ?? '').toString() === selectedStatus)
    }
    // company filter (case-insensitive substring match)
    const q = (companyQuery || '').toString().trim().toLowerCase()
    if (q.length > 0) {
      out = out.filter(d => (d.empresa || '').toString().toLowerCase().includes(q))
    }
    return out
  }, [data, selectedView, selectedStatus, companyQuery])

  const table = useReactTable({
    data: displayedData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (active && over && active.id !== over.id) {
        setData((currentData) => {
          const oldIndex = dataIds.indexOf(active.id)
          const newIndex = dataIds.indexOf(over.id)
          return arrayMove(currentData, oldIndex, newIndex)
        })

        // Chama o callback se fornecido
        if (onTasksReorder) {
          const newOrder = arrayMove(dataIds, dataIds.indexOf(active.id), dataIds.indexOf(over.id))
          await onTasksReorder(newOrder.map(id => id.toString()))
        }
      }
    },
    [dataIds, onTasksReorder]
  )

  // Bulk: mark selected 'Automático' tasks as 'pendente' (only those that already have responsible)
  const bulkDesignate = React.useCallback(async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (!selectedRows.length) return
    const targets = selectedRows.map(r => r.original).filter(t => String(t.status) === 'Automático')
    if (!targets.length) {
      try { toastWarning('Seleção não contém tarefas com status Automático') } catch {}
      return
    }
    const withResponsible = targets.filter(t => (t.responsavelId != null) || (t.responsavel && t.responsavel !== 'Não atribuído'))
    const withoutResponsible = targets.filter(t => !withResponsible.includes(t))
    if (withoutResponsible.length) {
      try { toastWarning(`${withoutResponsible.length} tarefa(s) sem responsável — pulei essas`) } catch {}
    }

    if (!withResponsible.length) return

    setBulkWorking(true)
    try {
      await Promise.all(
        withResponsible.map(t => updateTaskService(Number(t.id), { status: 'pendente' }))
      )
      // update local state
      setData(prev => prev.map(d => withResponsible.some(t => t.id === d.id) ? { ...d, status: 'pendente' } : d))
      try { toastSuccess('Tarefas designadas e marcadas como pendentes') } catch {}
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Falha na designação em massa:', err)
      try { toastError('Falha ao designar algumas tarefas') } catch {}
    } finally {
      setBulkWorking(false)
      // clear selection after action
      setRowSelection({})
    }
  }, [table, onRefresh])

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <div className="flex items-center gap-2">
          {/* Company search input */}
          <div className="relative flex items-center">
            <Input
              placeholder="Pesquisar empresa"
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              className="pr-8 w-44 text-sm"
              id="company-search"
            />
            {companyQuery ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompanyQuery('')}
                className="absolute right-1"
                aria-label="Limpar pesquisa"
              >
                <IconX />
              </Button>
            ) : (
              <IconSearch className="absolute right-2 text-muted-foreground size-4 pointer-events-none" />
            )}
          </div>
          {/* Styled native select: visually matches the Radix SelectTrigger */}
          <div className="relative">
            <select
              id="view-selector"
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="appearance-none border-input flex w-fit items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm pr-8"
            >
              <option value="outline" style={{ background: isDark ? '#0f1720' : undefined, color: isDark ? '#e6edf3' : undefined }}>Todas as finalidades</option>
              {uniqueFinalidades.map((f) => (
                <option key={f} value={f} style={{ background: isDark ? '#0f1720' : undefined, color: isDark ? '#e6edf3' : undefined }}>{f}</option>
              ))}
            </select>
            <IconChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 pointer-events-none text-muted-foreground" />
          </div>

          {/* Status filter */}
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
            <SelectTrigger className="flex w-fit" size="sm" id="status-selector">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {uniqueStatuses.map((s) => (
                <SelectItem key={s} value={s}>{getStatusText(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customizar colunas</span>
                <span className="lg:hidden">Colunas</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button size="sm" className="button-primary" disabled={bulkWorking} onClick={bulkDesignate}>
              {bulkWorking ? 'Designando…' : 'Designar em massa'}
            </Button>
          )}
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Sem resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} linhas selecionadas.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Linhas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Vá para a primeira página</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Página Anterior</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Próxima Página</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Vá para a última página</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}
