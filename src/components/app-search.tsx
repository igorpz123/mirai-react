"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { BrickWall, Home, Building2, FileText, Users, Map, ClipboardList, FilePlus2 } from "lucide-react"

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"

import { TooltipButton } from "./tooltip"
import { useAuth } from '@/hooks/use-auth'

type Page = { label: string; route: string; icon?: React.ComponentType<{ className?: string }>; keywords?: string[] }

const PAGES: Page[] = [
    { label: 'Início', route: '/', icon: Home, keywords: ['dashboard', 'home'] },
        { label: 'Comercial - Dashboard', route: '/comercial/dashboard', icon: FileText, keywords: ['propostas', 'vendas'] },
    { label: 'Comercial - Nova Proposta', route: '/comercial/proposta/nova', icon: FilePlus2, keywords: ['nova proposta', 'criar proposta'] },
        { label: 'Técnico - Dashboard', route: '/technical/dashboard', icon: ClipboardList, keywords: ['tarefas', 'técnico'] },
    { label: 'Técnico - Agenda', route: '/technical/agenda', icon: Map, keywords: ['agenda', 'calendário'] },
    { label: 'Empresas', route: '/empresas', icon: Building2, keywords: ['clientes', 'companhias'] },
    { label: 'Usuários (Admin)', route: '/admin/usuarios', icon: Users, keywords: ['admin', 'gestão usuários'] },
]

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = !!(user && (user.cargoId === 1 || user.cargoId === 2 || user.cargoId === 3))

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = (command: () => unknown) => {
        setOpen(false)
        command()
    }

        // Normalize query and extract potential IDs anywhere in the string
                const q = query
                    .normalize('NFKC')
                    // remove zero-width characters and BOM
                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                    // normalize special spaces to regular
                    .replace(/[\u00A0\u202F]/g, ' ')
                    // collapse multiple spaces
                    .replace(/\s+/g, ' ')
                .toLowerCase()
                .trim()
            const numMatch = q.match(/#?\s*(\d+)/)
            const anyId = numMatch ? Number(numMatch[1]) : null
            const hasTarefa = /\btarefa\b/.test(q)
            const hasProposta = /\bpropost(a|as)\b/.test(q)
        // Try to extract numbers specifically after keywords; fallback to anyId
            const tarefaSpecific = q.match(/tarefa[^\d]*(\d+)/i)
            const propostaSpecific = q.match(/propost(?:a|as)?[^\d]*(\d+)/i)
        const tarefaId = hasTarefa ? Number(tarefaSpecific?.[1] ?? anyId ?? NaN) : null
        const propostaId = hasProposta ? Number(propostaSpecific?.[1] ?? anyId ?? NaN) : null
        const idOnly = !hasTarefa && !hasProposta ? anyId : null

    const allPages = React.useMemo(() => {
        return isAdmin ? PAGES : PAGES.filter(p => !p.route.startsWith('/admin'))
    }, [isAdmin])

    const filteredPages = React.useMemo(() => {
        if (!q) return allPages
        return allPages.filter(p =>
            p.label.toLowerCase().includes(q) ||
            (p.keywords || []).some(k => k.toLowerCase().includes(q))
        )
    }, [q, allPages])

    return (
        <>
            <TooltipButton title="Pesquisar" hover="Pressione Ctrl + K" onClick={() => setOpen(true)} />
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Escreva um comando ou pesquise..."
                    value={query}
                    onValueChange={setQuery}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (hasProposta && (propostaId ?? idOnly)) {
                                e.preventDefault()
                                runCommand(() => navigate(`/comercial/proposta/${propostaId ?? idOnly}`))
                            } else if (hasTarefa && (tarefaId ?? idOnly)) {
                                e.preventDefault()
                                runCommand(() => navigate(`/technical/tarefa/${tarefaId ?? idOnly}`))
                            }
                        }
                    }}
                />
                <CommandList>
                    <CommandEmpty>Nenhum resultado.</CommandEmpty>

                    {/* Ações rápidas sugeridas */}
                                <CommandGroup heading="Ações">
                        <CommandItem onSelect={() => runCommand(() => navigate('/nova-tarefa'))}>
                            <BrickWall className="mr-2 h-4 w-4" />
                            <span>Nova Tarefa</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/comercial/proposta/nova'))}>
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            <span>Nova Proposta</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    {/* Ir direto por número digitado (prioritário quando há ID) */}
                    {(idOnly || tarefaId || propostaId) ? (
                        <CommandGroup heading="Ir para número">
                            {(idOnly || tarefaId) && (
                                <CommandItem value={`tarefa ${idOnly ?? tarefaId} #${idOnly ?? tarefaId} ${idOnly ?? tarefaId}`} onSelect={() => runCommand(() => navigate(`/technical/tarefa/${idOnly ?? tarefaId}`))}>
                                    <ClipboardList className="mr-2 h-4 w-4" />
                                    <span>Ir para tarefa #{idOnly ?? tarefaId}</span>
                                </CommandItem>
                            )}
                            {(idOnly || propostaId) && (
                                <CommandItem value={`proposta ${idOnly ?? propostaId} #${idOnly ?? propostaId} ${idOnly ?? propostaId}`} onSelect={() => runCommand(() => navigate(`/comercial/proposta/${idOnly ?? propostaId}`))}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Ir para proposta #{idOnly ?? propostaId}</span>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    ) : null}

                    {/* Páginas filtradas */}
                    <CommandGroup heading="Páginas">
                        {filteredPages.map((p) => (
                            <CommandItem key={p.route} value={`${p.label} ${(p.keywords || []).join(' ')}`} onSelect={() => runCommand(() => navigate(p.route))}>
                                {p.icon ? <p.icon className="mr-2 h-4 w-4" /> : null}
                                <span>{p.label}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                </CommandList>
            </CommandDialog>
        </>
    )
}