import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconSearch } from '@tabler/icons-react'
import { toastError } from '@/lib/customToast'

type Kind = 'proposal' | 'task'

export interface QuickIdSearchProps {
  kind: Kind
  className?: string
  placeholder?: string
  buttonLabel?: string
}

export const QuickIdSearch: React.FC<QuickIdSearchProps> = ({ kind, className, placeholder, buttonLabel }) => {
  const navigate = useNavigate()
  const [value, setValue] = React.useState('')

  const go = React.useCallback(() => {
    const raw = (value || '').trim()
    if (!raw) return
    const id = Number(raw)
    if (!Number.isFinite(id) || id <= 0) {
      toastError('Informe um número válido')
      return
    }
    if (kind === 'proposal') navigate(`/comercial/proposta/${id}`)
    else navigate(`/technical/tarefa/${id}`)
  }, [value, kind, navigate])

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`} data-tour="search-by-id">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={(e) => { if (e.key === 'Enter') go() }}
        placeholder={placeholder ?? (kind === 'proposal' ? 'Nº da proposta' : 'Nº da tarefa')}
        className="w-40"
        inputMode="numeric"
      />
      <Button onClick={go} size="sm" className='button-primary'>
        <IconSearch className="mr-0.5" /> {buttonLabel ?? 'Pesquisar'}
      </Button>
    </div>
  )
}

export default QuickIdSearch
