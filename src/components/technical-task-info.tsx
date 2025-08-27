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
    SheetTrigger,
} from "@/components/ui/sheet"

export function TaskInfo({ action, id, unidade }: { action: string, id?: string, unidade?: string }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">{action}</Button>
            </SheetTrigger>
            <SheetContent className="md:w-1/3 sm:w-full" side="right">
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
                            <Input disabled id="task-info-empresa" defaultValue="Empresa ABC" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-finalidade">Finalidade</Label>
                            <Input disabled id="task-info-finalidade" defaultValue="Renovação" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-prazo">Prazo</Label>
                            <Input disabled id="task-info-prazo" defaultValue="10/04/2025" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-status">Status</Label>
                            <Input disabled id="task-info-status" defaultValue="Pendente" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-prioridade">Prioridade</Label>
                            <Input disabled id="task-info-prioridade" defaultValue="Alta" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-setor">Setor</Label>
                            <Input disabled id="task-info-setor" defaultValue="" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-usuario">Responsável</Label>
                            <Input disabled id="task-info-usuario" defaultValue="Renovação" />
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
                    <Button className="button-success" type="submit">Salvar Alterações</Button>
                    <SheetClose asChild>
                        <Button variant="outline">Fechar</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}