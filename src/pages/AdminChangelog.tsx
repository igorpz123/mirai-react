import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { listChangelog, createChangelog, type ChangelogItem } from '@/services/changelog'
import { useAuth } from '@/hooks/use-auth'
import { toastError, toastSuccess } from '@/lib/customToast'

export default function AdminChangelog(): ReactElement {
  const [items, setItems] = useState<ChangelogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [version, setVersion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const canPublish = Number(user?.cargoId) === 1

  async function load() {
    setLoading(true)
    try {
      const data = await listChangelog(100)
      setItems(data)
    } catch (e) {
      toastError('Falha ao carregar changelog')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return toastError('Preencha título e descrição')
    setSubmitting(true)
    try {
      const created = await createChangelog({ title: title.trim(), body: body.trim(), version: version.trim() || undefined })
      setItems(prev => [created, ...prev])
      setTitle('')
      setBody('')
      setVersion('')
      toastSuccess('Entrada criada')
    } catch (e: any) {
      toastError(e?.response?.data?.message || 'Falha ao criar entrada')
    } finally {
      setSubmitting(false)
    }
  }

  const formattedItems = useMemo(() => items.map(it => ({
    ...it,
    date: new Date(it.created_at).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }),
  })), [items])

  return (
    <div className="container-main">
      <SiteHeader title='Changelog' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {canPublish && (
              <div className="px-4 lg:px-6">
                <form onSubmit={onSubmit} className="bg-card rounded-lg p-4 shadow-sm space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input placeholder="Versão (ex: v1.2.3)" value={version} onChange={e => setVersion(e.target.value)} />
                    <div className="md:col-span-3">
                      <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                  </div>
                  <Textarea placeholder="Descreva as alterações, correções e melhorias" value={body} onChange={e => setBody(e.target.value)} rows={5} />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Publicar'}</Button>
                  </div>
                </form>
              </div>
            )}

            <div className="px-4 lg:px-6">
              <div className="space-y-3">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : formattedItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma atualização publicada ainda</div>
                ) : (
                  formattedItems.map((it) => (
                    <Card key={it.id} className="bg-card">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>
                            {it.version ? <span className="text-primary font-medium mr-2">{it.version}</span> : null}
                            {it.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{it.date}{it.author_name ? ` · ${it.author_name}` : ''}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{it.body}</div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
