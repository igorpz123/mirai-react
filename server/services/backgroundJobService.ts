import { randomUUID } from 'crypto'

export interface JobProgress {
  current: number
  total: number
  percentage: number
}

export interface JobResult {
  processed: number
  createdTotal: number
  details: Array<{ empresaId: number; created: number }>
  yearsProcessed?: number
}

export interface Job {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: JobProgress
  result?: JobResult
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  userId?: number
}

class BackgroundJobService {
  private jobs = new Map<string, Job>()
  private readonly MAX_JOB_RETENTION_MS = 1000 * 60 * 60 // 1 hora

  constructor() {
    // Limpar jobs antigos a cada 10 minutos
    setInterval(() => {
      this.cleanupOldJobs()
    }, 1000 * 60 * 10)
  }

  /**
   * Cria um novo job e retorna o ID
   */
  createJob(type: string, userId?: number): string {
    const jobId = randomUUID()
    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
      createdAt: new Date(),
      userId,
    }
    this.jobs.set(jobId, job)
    return jobId
  }

  /**
   * Atualiza o status do job
   */
  updateJobStatus(jobId: string, status: Job['status']): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = status
    if (status === 'running' && !job.startedAt) {
      job.startedAt = new Date()
    }
    if ((status === 'completed' || status === 'failed') && !job.completedAt) {
      job.completedAt = new Date()
    }
  }

  /**
   * Atualiza o progresso do job
   */
  updateJobProgress(jobId: string, current: number, total: number): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.progress = {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    }
  }

  /**
   * Define o resultado do job ao completar
   */
  setJobResult(jobId: string, result: JobResult): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.result = result
    job.status = 'completed'
    job.completedAt = new Date()
  }

  /**
   * Define erro no job ao falhar
   */
  setJobError(jobId: string, error: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.error = error
    job.status = 'failed'
    job.completedAt = new Date()
  }

  /**
   * Obtém informações do job
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Remove jobs antigos da memória
   */
  private cleanupOldJobs(): void {
    const now = Date.now()
    for (const [jobId, job] of this.jobs.entries()) {
      const isCompleted = job.status === 'completed' || job.status === 'failed'
      const completedAt = job.completedAt?.getTime() || 0
      const age = now - completedAt

      if (isCompleted && age > this.MAX_JOB_RETENTION_MS) {
        this.jobs.delete(jobId)
        console.log(`[BackgroundJobService] Limpou job antigo: ${jobId}`)
      }
    }
  }

  /**
   * Lista todos os jobs (útil para debug)
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values())
  }
}

// Singleton instance
export const backgroundJobService = new BackgroundJobService()
