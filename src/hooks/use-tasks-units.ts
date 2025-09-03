// src/hooks/use-unit-tasks.ts
import { useState, useEffect, useCallback } from 'react';
import { getTasksByUnitId } from '../services/tasks';
import type { Task } from '../services/tasks';

export const useUnitTasks = (unitId: number | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!unitId) {
      setTasks([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTasksByUnitId(unitId);
      setTasks(response.tasks);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const refetchTasks = () => {
    fetchTasks();
  };

  return {
    tasks,
    total,
    loading,
    error,
    refetchTasks
  };
};