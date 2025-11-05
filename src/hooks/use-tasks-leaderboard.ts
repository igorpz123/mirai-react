import { useState, useEffect, useCallback } from 'react'
import { getTasksLeaderboard, type LeaderboardEntry, type TimePeriod } from '@/services/tasks'

interface UseTasksLeaderboardOptions {
  period?: TimePeriod
  unidade_id?: number
  autoFetch?: boolean
}

interface UseTasksLeaderboardReturn {
  data: LeaderboardEntry[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTasksLeaderboard(
  options: UseTasksLeaderboardOptions = {}
): UseTasksLeaderboardReturn {
  const { period = '30days', unidade_id, autoFetch = true } = options

  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getTasksLeaderboard({
        period,
        unidade_id,
      })

      setData(response.leaderboard || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar leaderboard'
      setError(errorMessage)
      console.error('Erro ao buscar leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [period, unidade_id])

  useEffect(() => {
    if (autoFetch) {
      fetchLeaderboard()
    }
  }, [autoFetch, fetchLeaderboard])

  return {
    data,
    loading,
    error,
    refetch: fetchLeaderboard,
  }
}
