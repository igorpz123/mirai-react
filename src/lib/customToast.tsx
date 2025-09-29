import React from 'react'
import { toast as sonnerToast } from 'sonner'
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react'

type ToastContent = React.ReactNode | string

type ToastOptions = { id?: string | number; onClick?: () => void }

const baseContainer = 'rounded-lg shadow-2xl w-full max-w-md mx-auto overflow-hidden'

const styles = {
  error: 'bg-gradient-to-r from-red-600 to-red-500 text-white',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-400 text-black',
  success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white',
}

const render = (variant: 'error' | 'warning' | 'success', title: string, content: ToastContent, opts?: ToastOptions) => {
  const cls = `${baseContainer} ${styles[variant]}`
  return sonnerToast.custom((t) => (
    <div
      role="status"
      aria-live="polite"
      onClick={() => { try { opts?.onClick && opts.onClick() } catch {} }}
      className={`${cls} animate-in slide-in-from-top-6 duration-300 cursor-pointer`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center shrink-0 w-6 h-6">
          {variant === 'error' && <IconX className="w-5 h-5" />}
          {variant === 'warning' && <IconAlertCircle className="w-5 h-5" />}
          {variant === 'success' && <IconCheck className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm leading-5">{title}</div>
          <div className="mt-1 text-sm leading-5 opacity-95">{typeof content === 'string' ? content : content}</div>
        </div>
        <div className="ml-3">
          <button aria-label="Fechar" onClick={(e) => { e.stopPropagation(); sonnerToast.dismiss(t) }} className="inline-flex items-center justify-center rounded-md p-1 hover:opacity-90 cursor-pointer">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ), { id: opts?.id })
}

export const toastError = (content: ToastContent, opts?: ToastOptions) => render('error', 'Erro ao executar a ação', content, opts)
export const toastWarning = (content: ToastContent, opts?: ToastOptions) => render('warning', 'Esta ação precisa de atenção', content, opts)
export const toastSuccess = (content: ToastContent, opts?: ToastOptions) => render('success', 'Ação executada com sucesso', content, opts)

export default { toastError, toastWarning, toastSuccess }
