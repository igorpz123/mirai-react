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
    updatedAt?: string | null;

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

// Define API base prioritizing explicit env; if running via Vite (5173) without VITE_API_URL, fallback to backend 5000
const API_URL = (() => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined
    if (envUrl && envUrl.trim().length) return envUrl.replace(/\/$/, '')
    // If current origin is localhost:5173 assume backend at :5000
    if (typeof window !== 'undefined' && window.location.port === '5173') {
        return 'http://localhost:5000/api'
    }
    // default relative (could be proxied in production config)
    return '/api'
})()
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
    const url = `${API_URL}/tarefas/${taskId}`
    try {
        // debug info
        try { console.debug('[tasks.updateTask] url:', url, 'tokenPresent:', !!token) } catch (e) { /* ignore */ }

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Erro ao atualizar tarefa' }));
            throw new Error(err.message || 'Erro ao atualizar tarefa');
        }

        return res.json();
    } catch (err) {
        // network or other fetch error (e.g., Failed to fetch)
        const message = err instanceof Error ? err.message : String(err)
        const detailed = `updateTask failed: ${message} (url: ${url}, tokenPresent: ${!!token})`
        try { console.error('[tasks.updateTask] ', detailed, err) } catch (e) { /* ignore */ }
        throw new Error(detailed)
    }
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

export async function getRecentTasksByUser(userId: number, limit: number = 10): Promise<TasksResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/usuario/${userId}/recentes?limit=${encodeURIComponent(String(limit))}` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erro ao buscar tarefas recentes do usuário' }));
        throw new Error(err.message || 'Erro ao buscar tarefas recentes do usuário');
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

    // Files (Arquivos) services for tasks
    export interface Arquivo { id: number; nome_arquivo: string; caminho: string }
    export async function listTaskFiles(taskId: number): Promise<Arquivo[]> {
        const token = localStorage.getItem('token');

        async function attempt(url: string): Promise<Arquivo[] | null> {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.status === 404) {
                // Sem arquivos (tratamos como lista vazia em vez de erro)
                return []
            }
            if (!res.ok) {
                return null
            }
            return res.json().catch(() => [])
        }

        // 1. Tenta rota consistente com upload (/tarefas/:id/arquivos)
        let data = await attempt(`${API_URL}/tarefas/${taskId}/arquivos`)
        if (data === null) {
            // 2. Fallback para rota antiga (/tarefas/arquivos/:id)
            data = await attempt(`${API_URL}/tarefas/arquivos/${taskId}`)
        }
        if (data === null) {
            throw new Error('Erro ao buscar arquivos')
        }
        return data
    }

    export async function uploadTaskFile(taskId: number, file: File): Promise<Arquivo> {
        const token = localStorage.getItem('token');
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${API_URL}/tarefas/${taskId}/arquivos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Erro ao enviar arquivo' }))
            throw new Error(err.message || 'Erro ao enviar arquivo')
        }
        return res.json()
    }

    export async function deleteTaskFile(taskId: number, arquivoId: number): Promise<{ deleted: boolean; id: number }> {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/tarefas/${taskId}/arquivos/${arquivoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Erro ao excluir arquivo' }))
            throw new Error(err.message || 'Erro ao excluir arquivo')
        }
        return res.json()
    }