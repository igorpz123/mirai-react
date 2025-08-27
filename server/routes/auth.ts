import { Router } from 'express';
import { login } from '../controllers/AuthController';

const router: Router = Router();

router.post('/login', login);
export default router;