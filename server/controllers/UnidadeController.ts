import pool from '../config/db'
import { createCrudController } from '../utils/crudController'

const crudController = createCrudController(pool, {
  tableName: 'unidades',
  entityName: 'unidade',
  entityNamePlural: 'unidades'
})

export const getUnidades = crudController.getAll
export const getUnidadeById = crudController.getById
export const createUnidade = crudController.create
export const updateUnidade = crudController.update
export const deleteUnidade = crudController.delete

export default { getUnidades, getUnidadeById, createUnidade, updateUnidade, deleteUnidade }
