import { Router } from 'express'
import ChangelogController from '../controllers/ChangelogController'

const router = Router()

router.get('/', ChangelogController.list)
router.post('/', ChangelogController.create)

export default router
