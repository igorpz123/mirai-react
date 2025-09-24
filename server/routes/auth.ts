import { Router } from 'express';
import { login, renew } from '../controllers/AuthController';

const router: Router = Router();

router.post('/login', login);
router.post('/renew', renew);
export default router;