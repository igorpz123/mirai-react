// src/services/authService.ts
import bcrypt from 'bcrypt'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { RowDataPacket } from 'mysql2'
import db from '../config/db'
import authConfig from '../config/auth'

interface User extends RowDataPacket {
  id: number
  email: string
  senha: string
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<string> {
  console.log('Login attempt:', { email, password });

  const [rows] = await db.query<User[]>(
    `SELECT id, email, senha 
     FROM usuarios 
     WHERE email = ?`,
    [email]
  )
  const user = rows[0]
  if (!user) {
    console.log('Usuário não encontrado para o email:', email);
    throw new Error('Usuário não encontrado.')
  }

  console.log('Usuário encontrado:', user);
  console.log('Senhas para comparação:');
  console.log('Senha enviada (plain):', password);
  console.log('Senha do banco (hash):', user.senha);

  // Se o hash usar o prefixo $2y$, substitua por $2a$ para compatibilidade
  let hashToCompare = user.senha;
  if (hashToCompare.startsWith('$2y$')) {
    hashToCompare = hashToCompare.replace('$2y$', '$2a$');
    console.log('Hash ajustado para comparação:', hashToCompare);
  }

  try {
    const match = await bcrypt.compare(password, hashToCompare)
    console.log('Resultado da comparação bcrypt:', match);

    if (!match) {
      console.log('Comparação de senha falhou');
      throw new Error('Senha inválida.')
    }

    const signOptions: SignOptions = {
      expiresIn: authConfig.jwtExpiresIn as any
    }

    return jwt.sign(
      { userId: user.id },
      authConfig.jwtSecret as Secret,
      signOptions
    )
  } catch (error) {
    console.error('Erro durante a comparação de senha:', error);
    throw new Error('Erro ao validar senha')
  }
}