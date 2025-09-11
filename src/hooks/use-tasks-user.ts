import { useState, useEffect, useCallback } from 'react';
import { getTasksByUserId } from '@/services/tasks';
import type { Task } from '@/services/tasks';

interface UseUserTasksReturn {
  tasks: Task[];
  total: number;
  loading: boolean;
  error: string | null;
  refetchTasks: () => Promise<void>;
}

export const useUserTasks = (userId: number | null): UseUserTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!userId || userId <= 0) {
      setTasks([]);
      setTotal(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTasksByUserId(userId);
      setTasks(response.tasks || []);
      setTotal(response.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
      setError(errorMessage);
      setTasks([]);
      setTotal(0);
      console.error('Erro ao buscar tarefas do usuário:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
