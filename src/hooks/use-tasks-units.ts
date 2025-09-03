// src/hooks/use-unit-tasks.ts
import { useState, useEffect, useCallback } from 'react';
import { getTasksByUnitId } from '@/services/tasks';
import type { Task } from '@/services/tasks';

interface UseUnitTasksReturn {
  tasks: Task[];
  total: number;
  loading: boolean;
  error: string | null;
  refetchTasks: () => Promise<void>;
}

export const useUnitTasks = (unitId: number | null): UseUnitTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async () => {
    // Se não houver unitId válido, limpa os dados
    if (!unitId || unitId <= 0) {
      setTasks([]);
      setTotal(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTasksByUnitId(unitId);
      setTasks(response.tasks || []);
      setTotal(response.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
      setError(errorMessage);
      setTasks([]);
      setTotal(0);
      console.error('Erro ao buscar tarefas:', err);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  // Busca automática quando unitId mudar
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    total,
    loading,
    error,
    refetchTasks: fetchTasks
  };
};