import { Router } from 'express'
import NotificationController from '../controllers/NotificationController'

const router = Router()

router.get('/', NotificationController.list)
router.post('/read-all', NotificationController.markAll)
router.post('/:id/read', NotificationController.markRead)

export default router
