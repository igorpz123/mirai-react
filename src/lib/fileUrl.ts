/**
 * Constrói URL completa para arquivos públicos (uploads)
 * Em produção: usa o domínio atual do navegador
 * Em desenvolvimento: usa variáveis de ambiente ou localhost:5000
 */
export function buildFileUrl(path: string): string {
  if (!path) return '#'
  
  // Se já é uma URL completa, retorna como está
  if (/^https?:\/\//i.test(path)) return path
  
  // Em produção (não localhost), usar o domínio atual do navegador
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const origin = window.location.origin
    if (path.startsWith('/uploads') || path.startsWith('/api')) {
      return origin + path
    }
    return origin + '/api' + path
  }
  
  // Em desenvolvimento, usar as variáveis de ambiente ou fallback para localhost
  const rawBase = (import.meta as any).env?.VITE_API_PUBLIC_BASE || (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'
  const baseHttp = rawBase.startsWith('http') ? rawBase : 'http://localhost:5000/api'
  const origin = baseHttp.replace(/\/api\/?$/, '')
  
  // Para arquivos públicos, garantir que usamos a ORIGEM sem /api
  if (path.startsWith('/uploads')) {
    return origin + path
  }
  
  // Para outros caminhos, usar /api
  return origin + '/api' + path
}
