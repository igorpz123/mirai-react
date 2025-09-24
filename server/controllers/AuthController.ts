// server/controllers/authController.ts
import { Request, Response } from 'express';
import * as authService from '../services/authService';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const { token, user } = await authService.authenticateUser(email, password);
    return res.json({ token, user }); // Retorna o token e as informações do usuário
  } catch (err: any) {
    return res.status(401).json({ message: err.message });
  }
}

// Permite renovar o token se ainda estiver válido (ou dentro de um pequeno grace period)
export async function renew(req: Request, res: Response) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: 'Token ausente' })
  const token = auth.replace('Bearer ', '')
  try {
    const decoded: any = jwt.verify(token, authConfig.jwtSecret)
    const userId = decoded.userId || decoded.id
    if (!userId) return res.status(401).json({ message: 'Token inválido' })
    const user = await authService.getUserById(Number(userId))
    if (!user) return res.status(401).json({ message: 'Usuário inativo' })
    const newToken = authService.signUserToken(user)
    return res.json({ token: newToken, user })
  } catch (err: any) {
    return res.status(401).json({ message: 'Token expirado ou inválido' })
  }
}