// Utilidades relacionadas a cargos / perfis
// Centraliza a lógica de identificar um usuário técnico.

export const CARGO_TECNICO_IDS = [4]; // Ajustar aqui caso novos IDs sejam considerados técnicos

export function isTecnicoUser(u: any): boolean {
  if (!u) return false;
  const id = Number((u as any).cargo_id ?? (u as any).cargoId);
  if (!Number.isNaN(id) && CARGO_TECNICO_IDS.includes(id)) return true;
  const nomeCargo = ((u as any).cargo || '').toString().toLowerCase();
  // cobre "tecnico" e "técnico" e variações com acento
  if (nomeCargo.includes('tecnic')) return true;
  return false;
}
