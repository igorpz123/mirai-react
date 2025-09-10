import { useCallback, useEffect, useState } from 'react';
import { getCompletedTasksByDay } from '@/services/tasks';

interface CompletedByDay {
  date: string | null;
  concluidas: number;
}

export const useCompletedByUnit = (unitId: number | null) => {
  const [data, setData] = useState<CompletedByDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!unitId || unitId <= 0) {
      setData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getCompletedTasksByDay(unitId);
      setData(res || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
      setData([]);
      console.error('Erro ao buscar tarefas concluídas por dia:', err);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
