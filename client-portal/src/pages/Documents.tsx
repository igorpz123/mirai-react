import Layout from '../components/Layout'
import { Card, CardContent } from '../components/ui/card'
import { IconFile, IconDownload, IconClock } from '@tabler/icons-react'
import { Button } from '../components/ui/button'

export default function Documents() {
  // Mock data - substituir por chamada à API
  const documents = [
    {
      id: 1,
      nome: 'PCMSO - Programa de Controle Médico',
      tipo: 'PDF',
      tamanho: '2.5 MB',
      data_upload: '2025-01-15',
      categoria: 'Programas',
    },
    {
      id: 2,
      nome: 'PGR - Programa de Gerenciamento de Riscos',
      tipo: 'PDF',
      tamanho: '3.8 MB',
      data_upload: '2025-01-10',
      categoria: 'Programas',
    },
    {
      id: 3,
      nome: 'Certificado NR35 - Trabalho em Altura',
      tipo: 'PDF',
      tamanho: '1.2 MB',
      data_upload: '2025-01-08',
      categoria: 'Certificados',
    },
    {
      id: 4,
      nome: 'Certificado NR10 - Eletricidade',
      tipo: 'PDF',
      tamanho: '1.1 MB',
      data_upload: '2025-01-05',
      categoria: 'Certificados',
    },
  ]

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = []
    }
    acc[doc.categoria].push(doc)
    return acc
  }, {} as Record<string, typeof documents>)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meus Documentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acesse e baixe seus documentos e certificados
          </p>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconFile className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Nenhum documento disponível
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Seus documentos aparecerão aqui quando estiverem prontos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocs).map(([categoria, docs]) => (
              <div key={categoria}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {categoria}
                </h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                              <IconFile className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {doc.nome}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span>{doc.tipo} • {doc.tamanho}</span>
                                <span className="flex items-center gap-1">
                                  <IconClock className="w-4 h-4" />
                                  {new Date(doc.data_upload).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="gap-2"
                          >
                            <IconDownload className="w-4 h-4" />
                            Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
