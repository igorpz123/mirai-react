import { useCallback, useEffect, useState } from 'react';
import { getCompletedTasksByDayByUser } from '@/services/tasks';

interface CompletedByDay {
  date: string | null;
  concluidas: number;
}

export const useCompletedByUser = (userId: number | null) => {
  const [data, setData] = useState<CompletedByDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId || userId <= 0) {
      setData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getCompletedTasksByDayByUser(userId);
      setData(res || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
      setData([]);
      console.error('Erro ao buscar tarefas concluídas por dia (usuário):', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
