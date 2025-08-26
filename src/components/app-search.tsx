"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom" // 1. Importe o useNavigate
import {
    Calculator,
    BrickWall,
    CreditCard,
    Settings,
    Cuboid,
    User,
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"

import { TooltipButton } from "./tooltip"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const navigate = useNavigate() // 2. Crie a instância do navigate

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

    return (
        <>
            <TooltipButton title="Pesquisar" hover="Pressione Ctrl + K"/>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Escreva um comando ou pesquise..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Sugestões">
                        {/* 3. Adicione o onSelect para navegar */}
                        <CommandItem onSelect={() => runCommand(() => navigate('/projetos'))}>
                            <BrickWall className="mr-2 h-4 w-4" />
                            <span>Projetos</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/materiais'))}>
                            <Cuboid className="mr-2 h-4 w-4" />
                            <span>Materiais</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/calculadora'))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Calculadora</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem onSelect={() => runCommand(() => navigate('/perfil'))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Perfil</span>
                            <CommandShortcut>⌘P</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/cobranca'))}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Cobrança</span>
                            <CommandShortcut>⌘B</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/configuracoes'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}