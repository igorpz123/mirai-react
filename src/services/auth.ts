export interface LoginCredentials { email: string; password: string; }
export interface AuthResponse { token: string; }

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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