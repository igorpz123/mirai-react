// src/services/tasks.ts

export interface Task {
    id: number;
    empresa: string;
    unidade: string;
    finalidade: string;
    status: string;
    prioridade: string;
    setor: string;
    prazo: string;
    responsavel: string;

}

export interface CreateTaskData {
    titulo: string;
    descricao: string;
    status: string;
    prioridade: string;
    dataInicio: string;
    dataFim: string;
    unidadeId: number;
    setorId: number;
    usuarioId: number;
}

export interface UpdateTaskData {
    titulo?: string;
    descricao?: string;
    status?: string;
    prioridade?: string;
    dataInicio?: string;
    dataFim?: string;
    unidadeId?: number;
    setorId?: number;
    usuarioId?: number;
}

export interface TasksResponse {
    tasks: Task[];
    total: number;
    message?: string;
}

export interface TaskResponse {
    task: Task;
    message?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api'
// const API_URL = import.meta.env.VITE_API_URL || 'https://psychic-yodel-p9jw56vx476f6wj4-5000.app.github.dev/api';

export async function getTasksByUnitId(unitId: number): Promise<TasksResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/unidade/${unitId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas da unidade');
    }

    return res.json();
}

export async function getAllTasks(): Promise<TasksResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas');
    }

    return res.json();
}

export async function getTaskById(taskId: number): Promise<TaskResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/${taskId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefa');
    }

    return res.json();
}

export async function createTask(taskData: CreateTaskData): Promise<TaskResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao criar tarefa');
    }

    return res.json();
}

export async function updateTask(taskId: number, taskData: UpdateTaskData): Promise<TaskResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao atualizar tarefa');
    }

    return res.json();
}

export async function deleteTask(taskId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao deletar tarefa');
    }

    return res.json();
}

export interface TaskStatsResponse {
    totalByStatus: Record<string, number>;
    trendByStatus: Record<string, { current: number; previous: number; percent: number }>;
    overdue: { current: number; previous: number; percent: number };
}

export async function getTaskStatsByUnit(unitId: number): Promise<TaskStatsResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/unidade/${unitId}/stats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar estatísticas de tarefas');
    }

    return res.json();
}

export interface CompletedByDay {
    date: string | null;
    concluidas: number;
}

export async function getCompletedTasksByDay(unitId: number): Promise<CompletedByDay[]> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/unidade/${unitId}/completadas-dia`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas concluídas por dia');
    }

    return res.json();
}

export async function getTasksByUserId(userId: number): Promise<TasksResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/usuario/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas do usuário');
    }

    return res.json();
}

export async function getTasksByResponsavel(userId: number): Promise<TasksResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/responsavel/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas do usuário');
    }

    return res.json();
}

export async function getTasksByCompany(empresaId: number): Promise<TasksResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/empresa/${empresaId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas da empresa');
    }

    return res.json();
}

export async function getTaskStatsByUser(userId: number): Promise<TaskStatsResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/usuario/${userId}/stats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar estatísticas de tarefas do usuário');
    }

    return res.json();
}

export async function getCompletedTasksByDayByUser(userId: number): Promise<CompletedByDay[]> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/usuario/${userId}/completadas-dia`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar tarefas concluídas por dia do usuário');
    }

    return res.json();
}

export async function getTaskHistory(taskId: number): Promise<any[]> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/historico/${taskId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erro ao buscar histórico' }));
        throw new Error(err.message || 'Erro ao buscar histórico');
    }

    return res.json();
}

export interface AddObservationResponse { id: number; message: string }

export async function addTaskObservation(taskId: number, usuarioId: number, observacoes: string): Promise<AddObservationResponse> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/tarefas/${taskId}/observacoes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuario_id: usuarioId, observacoes }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erro ao adicionar observação' }));
        throw new Error(err.message || 'Erro ao adicionar observação');
    }

    return res.json();
}