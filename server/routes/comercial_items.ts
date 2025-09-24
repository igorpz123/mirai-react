import { Router } from 'express'
import { listCommercialItems } from '../controllers/CommercialItemsController'

const router = Router()

// GET /api/comercial/items/:tipo
router.get('/items/:tipo', listCommercialItems)

export default router