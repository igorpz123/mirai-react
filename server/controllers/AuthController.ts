import { Request, Response } from 'express';
import * as authService from '../services/authService';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios.' });

  try {
    const token = await authService.authenticateUser(email, password);
    return res.json({ token });
  } catch (err: any) {
    return res.status(401).json({ message: err.message });
  }
}