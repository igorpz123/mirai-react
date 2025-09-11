import * as React from "react"
import { useState } from "react"
import type { Task } from "../services/tasks"
import { getUsersByDepartmentAndUnit, updateUserResponsibleForTask, getUsersByUnitId, getAllUsers } from '@/services/users';
import type { User } from '@/services/users';
import { useUnit } from '@/contexts/UnitContext';
import { useTheme } from '@/components/layout/theme-provider';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconProgress,
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

import { Badge } from "@/components/ui/badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"
import { TaskInfo } from "@/components/technical-task-info";

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
  prazo: string
  limit: string
  responsavel: string
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
})

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('pt-BR')

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
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Arraste para ordenar</span>
    </Button>
  )
}

// columns moved inside component so we can access component props/state

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export const TechnicalTaskTable: React.FC<TechnicalTaskTableProps> = ({
  tasks,
  onRefresh,
  onTaskUpdate,
  onTasksReorder,
}) => {
  const { unitId } = useUnit();

  function ResponsibleSelect({ task }: { task: TableTask }) {
    const [users, setUsers] = React.useState<User[] | null>(null)
    const [loadingUsers, setLoadingUsers] = React.useState(false)
    const [errorUsers, setErrorUsers] = React.useState<string | null>(null)
  const [debugEndpoint, setDebugEndpoint] = React.useState<string | null>(null)
  const [lastRawData, setLastRawData] = React.useState<any | null>(null)
  const [assigning, setAssigning] = React.useState(false)

    React.useEffect(() => {
      let mounted = true
  let endpointUsed = ''
      async function fetchUsers() {
        setLoadingUsers(true)
        setErrorUsers(null)
        try {
          // tenta buscar por setor e unidade quando possível
          if (task.setorId && task.unidadeId) {
            endpointUsed = `${task.unidadeId}/setor/${task.setorId}`
            const res = await getUsersByDepartmentAndUnit(task.setorId, task.unidadeId)
            if (!mounted) return
            setLastRawData(res)
            setUsers(res.users || [])
          } else if (task.unidadeId || unitId) {
            const uid = task.unidadeId || unitId || 0
            if (uid > 0) {
              endpointUsed = `unidade/${uid}`
              const res = await getUsersByUnitId(uid)
              if (!mounted) return
              setLastRawData(res)
              let list = res.users || []
              // if we have setor name but not setorId, filter by setor name
              if (task.setor) {
                const setorName = task.setor.toString().toLowerCase()
                list = (list as any[]).filter((u: any) => {
                  const candidates = [u.setor_nomes, u.setorNomes, u.setores, u.setor, u.setor_nome]
                  return candidates.some((c: any) => typeof c === 'string' && c.toLowerCase().includes(setorName))
                })
              }
              setUsers(list)
            } else {
              endpointUsed = `all`
              const res = await getAllUsers()
              if (!mounted) return
              setLastRawData(res)
              setUsers(res.users || [])
            }
          } else {
            endpointUsed = `all`
            const res = await getAllUsers()
            if (!mounted) return
            setLastRawData(res)
            setUsers(res.users || [])
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários'
          setErrorUsers(msg)
          setUsers([])
        } finally {
          if (mounted) setLoadingUsers(false)
          // debug
          console.debug('[ResponsibleSelect] fetched users', { taskId: task.id, endpoint: endpointUsed, count: (users || []).length, raw: lastRawData })
          if (mounted) setDebugEndpoint(endpointUsed)
        }
      }

      fetchUsers()

      return () => {
        mounted = false
      }
    }, [task.setorId, task.unidadeId, unitId])

    const handleAssign = async (userIdValue: string) => {
      const userId = Number(userIdValue)
      // ignore placeholder/invalid selections
      if (userIdValue === '__none') return
      if (!userId || Number.isNaN(userId)) return

      const selectedUser = users?.find(u => u.id === userId)

      try {
        setAssigning(true)
        await updateUserResponsibleForTask(task.id, userId)

        // Atualiza UI local imediatamente
        setData(prev => prev.map(d => d.id === task.id ? { ...d, responsavel: selectedUser ? selectedUser.nome : d.responsavel } : d))

        // chama callback externo se houver
        if (onRefresh) onRefresh()
        if (onTaskUpdate) {
          // notifies parent if it wants to persist changes locally
          onTaskUpdate(String(task.id), { responsavel: selectedUser ? selectedUser.nome : undefined } as Partial<Task>)
        }
      } catch (err) {
        console.error('Erro ao atribuir responsável:', err)
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

    return (
      <Select onValueChange={handleAssign}>
        <SelectTrigger
          disabled={assigning}
          className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
          size="sm"
          id={`${task.id}-responsavel`}
        >
          <SelectValue placeholder={assigning ? 'Atribuindo...' : 'Designar Responsável'} />
        </SelectTrigger>
        <SelectContent align="end">
          {users && users.length > 0 ? (
            users.map((u) => (
              <SelectItem key={u.id} value={`${u.id}`}>
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
      setorId: (task as any).setorId || undefined,
      unidadeId: (task as any).unidadeId || undefined,
      prazo: task.prazo || '',
      limit: task.prazo || '',
      responsavel: task.responsavel || 'Não atribuído'
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
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // View selector state: controls which 'finalidade' is shown
  const [selectedView, setSelectedView] = React.useState<string>('outline')

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

  const columns: ColumnDef<z.infer<typeof schema>>[] = [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
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
        const status = row.original.status;
        const statusText = getStatusText(row.original.status);
        let badgeClass = "";
        let icon = null;

        if (status === "concluída") {
          badgeClass = "button-success";
          icon = <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />;
        } else if (status === "progress") {
          badgeClass = "button-primary";
          icon = <IconProgress />;
        } else {
          icon = <IconLoader className="animate-spin" />;
        }

        return (
          <Badge variant="outline" className={badgeClass}>
            {icon}
            {statusText}
          </Badge>
        );
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

        const statusText = getStatusText(row.original.status);
        const prazo = formatDate(row.original.prazo);

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
                >
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem>Favoritar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Deletar</DropdownMenuItem>
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
              status={statusText}
              prioridade={prioridade}
              setor={setor}
              responsavel={responsavel}
            />
          </>
        )
      },
    },
  ]

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
    return out
  }, [data, selectedView, selectedStatus])

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
