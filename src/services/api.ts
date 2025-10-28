// src/services/api.ts
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse
} from 'axios';

// Base URL da API - use relative path so Vite dev proxy forwards to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Cria instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor de request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Garante que headers exista
    config.headers = config.headers ?? {};
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - redireciona para login apenas em 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Apenas redireciona para login se for erro de autenticação (401)
    if (error.response?.status === 401) {
      console.warn('Token inválido ou expirado. Redirecionando para login...')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Interfaces de modelo
export interface User {
  id: number
  nome: string
  email: string
  tipo: string
}

export interface LoginResponse {
  token: string
  user: User
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth.php/login', { email, password })
    return response.data
  },
  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth.php/me')
    return response.data
  }
}

// Dashboard API (retornos tipados como any, ajuste conforme seu contrato)
export const dashboardAPI = {
  getMetrics: async (): Promise<any> => {
    const response = await api.get('/dashboard.php/metrics')
    return response.data
  },
  getTasksChart: async (period = 7): Promise<any> => {
    const response = await api.get(`/dashboard.php/tasks-chart?period=${period}`)
    return response.data
  },
  getRecommendedTasks: async (): Promise<any> => {
    const response = await api.get('/dashboard.php/recommended-tasks')
    return response.data
  }
}

// Tasks API
export const tasksAPI = {
  getTasks: async (): Promise<any[]> => {
    const response = await api.get('/tasks.php')
    return response.data
  },
  createTask: async (taskData: any): Promise<any> => {
    const response = await api.post('/tasks.php', taskData)
    return response.data
  },
  updateTask: async (id: number, taskData: any): Promise<any> => {
    const response = await api.put(`/tasks.php/${id}`, taskData)
    return response.data
  },
  deleteTask: async (id: number): Promise<any> => {
    const response = await api.delete(`/tasks.php/${id}`)
    return response.data
  }
}

export default api