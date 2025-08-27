export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Unidade {
  id: number;
  nome: string;
}

export interface Setor {
  id: number;
  nome: string;
}

export interface User {
  id: number;
  email: string;
  nome: string;
  sobrenome: string;
  cargo: string;
  cargoId: number;
  fotoUrl?: string;
  unidades?: Unidade[];
  setores?: Setor[];
  // adicione outros campos se necessário
}

export interface AuthResponse {
  token: string;
  user: User;
}

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_URL = import.meta.env.VITE_API_URL || 'https://psychic-yodel-p9jw56vx476f6wj4-5000.app.github.dev/api';

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao fazer login');
  }
  
  return res.json();
}