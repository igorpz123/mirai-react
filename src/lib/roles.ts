// Utilidades relacionadas a cargos / perfis
// Centraliza a lógica de identificar um usuário técnico.
import { TECHNICAL_ROLES } from '@/constants/roles'

export function isTecnicoUser(u: any): boolean {
  if (!u) return false;
  const id = Number((u as any).cargo_id ?? (u as any).cargoId);
  // Usa a lista centralizada de cargos técnicos (3, 4, 5)
  if (!Number.isNaN(id) && TECHNICAL_ROLES.has(id)) return true;
  // Fallback por nome do cargo (mantém compatibilidade com dados antigos)
  const nomeCargo = ((u as any).cargo || '').toString().toLowerCase();
  // cobre "tecnico" e "técnico" e variações com acento
  if (nomeCargo.includes('tecnic')) return true;
  return false;
}
