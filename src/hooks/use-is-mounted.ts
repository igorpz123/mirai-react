import { useEffect, useRef } from 'react'

// Retorna true somente após o primeiro commit estável no cliente
// Útil para evitar montar componentes que criam/removem portais (Select/Dialog)
// durante o ciclo de double-invoke do React.StrictMode em dev.
export function useIsMounted() {
  const mountedRef = useRef(false)
  useEffect(() => { mountedRef.current = true }, [])
  return mountedRef.current
}
