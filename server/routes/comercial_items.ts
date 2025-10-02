import { Router } from 'express'
import { listCommercialItems, getProgramPriceRules, getProductPriceRules } from '../controllers/CommercialItemsController'

const router = Router()

// GET /api/comercial/items/:tipo
router.get('/items/:tipo', listCommercialItems)

// GET /api/comercial/programas/:id/regras - lista regras de preço do programa
router.get('/programas/:id/regras', getProgramPriceRules)
// GET /api/comercial/produtos/:id/regras - lista regras de preço do produto
router.get('/produtos/:id/regras', getProductPriceRules)

export default router