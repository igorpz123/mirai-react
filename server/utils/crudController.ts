import { Request, Response } from 'express'
import { Pool, RowDataPacket, OkPacket } from 'mysql2/promise'
import { handleControllerError } from './errorHandler'
import { validateRequiredString } from './validation'

/**
 * Configuration for generic CRUD controller
 */
export interface CrudConfig {
  tableName: string
  entityName: string // e.g., 'setor', 'unidade'
  entityNamePlural: string // e.g., 'setores', 'unidades'
  primaryKey?: string
  nameField?: string
}

/**
 * Creates a standard CRUD controller for simple entities with id and nome fields
 */
export function createCrudController(pool: Pool, config: CrudConfig) {
  const {
    tableName,
    entityName,
    entityNamePlural,
    primaryKey = 'id',
    nameField = 'nome'
  } = config

  /**
   * Get all entities
   */
  const getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const [rows] = await pool.query(
        `SELECT ${primaryKey}, ${nameField} FROM ${tableName} ORDER BY ${nameField} ASC`
      ) as [RowDataPacket[], unknown]

      res.status(200).json({ [entityNamePlural]: rows, total: rows.length })
    } catch (error) {
      handleControllerError(error, res, `buscar ${entityNamePlural}`, `Erro ao buscar ${entityNamePlural}`)
    }
  }

  /**
   * Get entity by ID
   */
  const getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const [rows] = await pool.query(
        `SELECT ${primaryKey}, ${nameField} FROM ${tableName} WHERE ${primaryKey} = ? LIMIT 1`,
        [id]
      ) as [RowDataPacket[], unknown]

      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(404).json({ message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} não encontrado(a)` })
        return
      }
      res.status(200).json(rows[0])
    } catch (error) {
      handleControllerError(error, res, `buscar ${entityName}`, `Erro ao buscar ${entityName}`)
    }
  }

  /**
   * Create new entity
   */
  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body as Record<string, unknown>
      const validation = validateRequiredString(data[nameField], nameField.charAt(0).toUpperCase() + nameField.slice(1))
      
      if (!validation.valid) {
        res.status(400).json({ message: validation.error })
        return
      }

      const [result] = await pool.query(
        `INSERT INTO ${tableName} (${nameField}) VALUES (?)`,
        [data[nameField]]
      ) as [OkPacket, unknown]

      res.status(201).json({ [primaryKey]: result.insertId, [nameField]: data[nameField] })
    } catch (error) {
      handleControllerError(error, res, `criar ${entityName}`, `Erro ao criar ${entityName}`)
    }
  }

  /**
   * Update entity
   */
  const update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const data = req.body as Record<string, unknown>
      const validation = validateRequiredString(data[nameField], nameField.charAt(0).toUpperCase() + nameField.slice(1))
      
      if (!validation.valid) {
        res.status(400).json({ message: validation.error })
        return
      }

      const [result] = await pool.query(
        `UPDATE ${tableName} SET ${nameField} = ? WHERE ${primaryKey} = ?`,
        [data[nameField], id]
      ) as [OkPacket, unknown]

      if (result.affectedRows === 0) {
        res.status(404).json({ message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} não encontrado(a)` })
        return
      }

      res.status(200).json({ [primaryKey]: Number(id), [nameField]: data[nameField] })
    } catch (error) {
      handleControllerError(error, res, `atualizar ${entityName}`, `Erro ao atualizar ${entityName}`)
    }
  }

  /**
   * Delete entity
   */
  const deleteEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const [result] = await pool.query(
        `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`,
        [id]
      ) as [OkPacket, unknown]

      if (result.affectedRows === 0) {
        res.status(404).json({ message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} não encontrado(a)` })
        return
      }

      res.status(204).send()
    } catch (error) {
      handleControllerError(error, res, `excluir ${entityName}`, `Erro ao excluir ${entityName}`)
    }
  }

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteEntity
  }
}
