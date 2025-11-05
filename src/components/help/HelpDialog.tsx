import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { helpModules, searchHelp, type HelpSection } from '@/data/helpContent'
import { IconSearch, IconBook, IconBulb, IconPlayerPlay, IconChevronRight } from '@tabler/icons-react'

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId?: string
}

export function HelpDialog({ open, onOpenChange, moduleId }: HelpDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedModule, setSelectedModule] = React.useState<string | null>(moduleId || null)
  const [selectedSection, setSelectedSection] = React.useState<string | null>(null)

  // Auto-select module quando moduleId muda
  React.useEffect(() => {
    if (moduleId && open) {
      setSelectedModule(moduleId)
      setSelectedSection(null)
    }
  }, [moduleId, open])

  // Busca de conteúdo
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchHelp(searchQuery)
  }, [searchQuery])

  // Módulo atual
  const currentModule = selectedModule ? helpModules[selectedModule] : null

  // Seção atual
  const currentSection = currentModule?.sections.find(s => s.id === selectedSection)

  const renderSection = (section: HelpSection) => (
    <div key={section.id} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
        <p className="text-sm text-muted-foreground">{section.content}</p>
      </div>

      {section.steps && section.steps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <IconPlayerPlay size={16} />
            Passo a passo
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            {section.steps.map((step, idx) => (
              <li key={idx} className="text-muted-foreground pl-2">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {section.tips && section.tips.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <IconBulb size={16} className="text-yellow-500" />
            Dicas
          </h4>
          <ul className="space-y-1.5 text-sm">
            {section.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <IconChevronRight size={16} className="flex-shrink-0 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IconBook size={24} />
            Central de Ajuda
          </DialogTitle>
          <DialogDescription>
            Encontre guias, tutoriais e dicas para usar o sistema
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {searchQuery.trim() ? (
            // Resultados da busca
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4">
                {searchResults.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <IconSearch size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhum resultado encontrado para "{searchQuery}"</p>
                  </div>
                ) : (
                  searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedModule(Object.entries(helpModules).find(([, m]) => m.title === result.module)?.[0] || null)
                        setSelectedSection(result.section.id)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <IconBook size={20} className="flex-shrink-0 mt-0.5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{result.module}</p>
                          <p className="font-medium mb-1">{result.section.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{result.section.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : selectedSection && currentSection ? (
            // Seção específica selecionada
            <ScrollArea className="h-full px-6 pb-6">
              <button
                onClick={() => setSelectedSection(null)}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                ← Voltar para {currentModule?.title}
              </button>
              {renderSection(currentSection)}
            </ScrollArea>
          ) : selectedModule && currentModule ? (
            // Lista de seções do módulo
            <ScrollArea className="h-full px-6 pb-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">{currentModule.title}</h2>
                <p className="text-muted-foreground">{currentModule.description}</p>
              </div>
              <div className="grid gap-3">
                {currentModule.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className="text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium mb-1">{section.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{section.content}</p>
                      </div>
                      <IconChevronRight className="flex-shrink-0 text-muted-foreground" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            // Grid de módulos
            <ScrollArea className="h-full px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(helpModules).map(([id, module]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedModule(id)}
                    className="text-left p-5 rounded-lg border hover:bg-muted/50 transition-colors h-full"
                  >
                    <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                    <p className="text-xs text-primary font-medium">
                      {module.sections.length} {module.sections.length === 1 ? 'tópico' : 'tópicos'}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
