import { Response } from 'express'

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  message: string
  code?: string
  details?: unknown
}

/**
 * MySQL error with code property
 */
interface MySQLError extends Error {
  code?: string
}

/**
 * Type guard to check if error is a MySQL error
 */
function isMySQLError(error: unknown): error is MySQLError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as MySQLError).code === 'string'
  )
}

/**
 * Centralized error handler for controllers
 * Logs the error and sends an appropriate response
 */
export function handleControllerError(
  error: unknown,
  res: Response,
  context: string,
  defaultMessage: string = 'Erro interno do servidor'
): void {
  console.error(`Erro em ${context}:`, error)

  // Handle specific MySQL errors
  if (isMySQLError(error)) {
    if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).json({ 
        message: 'Não é possível excluir: está vinculado a outros registros.',
        code: error.code 
      })
      return
    }

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ 
        message: 'Registro duplicado',
        code: error.code 
      })
      return
    }
  }

  // Default 500 error
  res.status(500).json({ message: defaultMessage })
}

/**
 * Async wrapper for controllers to handle errors automatically
 */
export function asyncHandler<T = unknown, U = unknown, V = unknown>(
  fn: (req: T, res: U, next?: V) => Promise<void>,
  context: string,
  defaultErrorMessage?: string
) {
  return async (req: T, res: U, next?: V) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      handleControllerError(error, res as Response, context, defaultErrorMessage)
    }
  }
}
