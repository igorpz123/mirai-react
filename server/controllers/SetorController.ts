import pool from '../config/db'
import { createCrudController } from '../utils/crudController'

const crudController = createCrudController(pool, {
  tableName: 'setor',
  entityName: 'setor',
  entityNamePlural: 'setores'
})

export const getSetores = crudController.getAll
export const getSetorById = crudController.getById
export const createSetor = crudController.create
export const updateSetor = crudController.update
export const deleteSetor = crudController.delete

export default { getSetores, getSetorById, createSetor, updateSetor, deleteSetor }
