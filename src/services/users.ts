// src/services/users.ts

export interface User {
    id: number;
    nome: string;
    sobrenome?: string;
    email: string;
    empresa?: string;
    unidade?: string;
    setor?: string;
    cargo?: string;
    ativo?: boolean;
    // Campos adicionais vindos do backend
    setores?: string; // CSV de ids
    setor_nomes?: string;
    unidades?: string; // CSV de ids
    unidade_nomes?: string;
    cargo_id?: number;
    foto_url?: string;
}

export interface CreateUserData {
    nome: string;
    sobrenome?: string;
    email: string;
    senha: string;
    empresaId: number;
    unidadeIds: number[];
    setorIds: number[];
    cargo?: string;
    // optional numeric cargo id (preferred)
    cargoId?: number;
}

export interface UpdateUserData {
    nome?: string;
    email?: string;
    senha?: string;
    empresaId?: number;
    unidadeId?: number;
    setorId?: number;
    cargo?: string;
    ativo?: boolean;
    // Back-end expects cargo_id numeric
    cargoId?: number;
}

export interface UsersResponse {
    users: User[];
    total: number;
    message?: string;
}

export interface UserResponse {
    user: User;
    message?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api'
// const API_URL = import.meta.env.VITE_API_URL || 'https://psychic-yodel-p9jw56vx476f6wj4-5000.app.github.dev/api';

export async function getUsersByDepartmentAndUnit(departmentId: number, unitId: number): Promise<UsersResponse> {
    const token = localStorage.getItem('token');
    // server exposes endpoint: /usuarios/unidade/:unidade_id/setor/:setor_id
    const res = await fetch(`${API_URL}/usuarios/unidade/${unitId}/setor/${departmentId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar usuários do setor e unidade');
    }

    const data = await res.json();
    // normalize: server may return array of rows or an object { users, total }
    if (Array.isArray(data)) {
        return { users: data as any[], total: data.length } as UsersResponse;
    }

    return data as UsersResponse;
}

export async function getUsersByUnitId(unitId: number): Promise<UsersResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/usuarios/unidade/${unitId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar usuários da unidade');
    }
    const data = await res.json();
    if (Array.isArray(data)) return { users: data as any[], total: data.length } as UsersResponse;
    return data as UsersResponse;
}

export async function getAllUsers(): Promise<UsersResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/usuarios`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar usuários');
    }

    const data = await res.json();
    if (Array.isArray(data)) return { users: data as any[], total: data.length } as UsersResponse;
    return data as UsersResponse;
}

export async function getUserById(userId: number): Promise<UserResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/usuarios/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao buscar usuário');
    }

    const data = await res.json();
    // backend pode retornar o usuário direto (não embrulhado em { user })
    if (data && !('user' in data)) {
        return { user: data as User } as UserResponse;
    }
    return data as UserResponse;
}

export async function createUser(userData: CreateUserData): Promise<UserResponse> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao criar usuário');
    }

    return res.json();
}

export async function updateUser(userId: number, userData: UpdateUserData): Promise<UserResponse> {
    const token = localStorage.getItem('token');

    // map camelCase cargoId -> snake cargo_id for backend
    const payload: any = { ...userData }
    if (typeof (payload as any).cargoId !== 'undefined') {
        payload.cargo_id = (payload as any).cargoId
        delete payload.cargoId
    }

    const res = await fetch(`${API_URL}/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao atualizar usuário');
    }

    return res.json();
}

export async function updateUserResponsibleForTask(taskId: number, userId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/tarefas/${taskId}/responsavel`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuarioId: userId }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao atribuir responsável à tarefa');
    }

    return res.json();
}

export async function deleteUser(userId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/usuarios/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao deletar usuário');
    }

    return res.json();
}

export async function inactivateUser(userId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/usuarios/${userId}/inactivate`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao inativar usuário');
    }

    return res.json();
}

export async function addUserSetores(userId: number, setorIds: number[]): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/usuarios/${userId}/setores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ setorIds })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao adicionar setor ao usuário');
    }
    return res.json();
}

export async function addUserUnidades(userId: number, unidadeIds: number[]): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/usuarios/${userId}/unidades`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ unidadeIds })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao adicionar unidade ao usuário');
    }
    return res.json();
}

export async function removeUserSetor(userId: number, setorId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/usuarios/${userId}/setores/${setorId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao remover setor do usuário');
    }
    return res.json();
}

export async function removeUserUnidade(userId: number, unidadeId: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/usuarios/${userId}/unidades/${unidadeId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao remover unidade do usuário');
    }
    return res.json();
}