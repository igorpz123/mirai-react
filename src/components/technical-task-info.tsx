import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

export function TaskInfo({
    open,
    onOpenChange,
    id,
    unidade,
    empresa,
    finalidade,
    prazo,
    status,
    prioridade,
    setor,
    responsavel,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    id: string
    unidade: string
    empresa?: string
    finalidade?: string
    prazo?: string
    status?: string
    prioridade?: string
    setor?: string
    responsavel?: string
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* tor­namos o children o gatilho do sheet */}
            <SheetContent className="md:w-1/2 sm:w-full" side="right">
                <SheetHeader>
                    <SheetTitle>Tarefa {id} | Unidade {unidade} </SheetTitle>
                    <SheetDescription>
                        Visualize os detalhes da tarefa.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-empresa">Empresa</Label>
                            <Input disabled id="task-info-empresa" defaultValue={empresa} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-finalidade">Finalidade</Label>
                            <Input disabled id="task-info-finalidade" defaultValue={finalidade} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-prazo">Prazo</Label>
                            <span className="font-light">{prazo}</span>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-status">Status</Label>
                            <Input disabled id="task-info-status" defaultValue={status} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-prioridade">Prioridade</Label>
                            <Input disabled id="task-info-prioridade" defaultValue={prioridade} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-setor">Setor</Label>
                            <Input disabled id="task-info-setor" defaultValue={setor} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-usuario">Responsável</Label>
                            <Input disabled id="task-info-usuario" defaultValue={responsavel} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="task-info-arquivos">Arquivos</Label>
                        <div id="task-info-arquivos" className="flex flex-col gap-1"></div>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="task-info-historico">Histórico</Label>
                        <div id="task-info-historico" className="flex flex-col gap-1"></div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline" className="cursor-pointer">Fechar</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}