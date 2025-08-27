// server/services/authService.ts
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import authConfig from '../config/auth';

interface User extends RowDataPacket {
  id: number;
  email: string;
  senha: string;
  nome: string; // Adicione outros campos
  sobrenome: string;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ token: string; user: Omit<User, 'senha'> }> {
  const [rows] = await db.query<User[]>(
    `SELECT id, email, senha, nome, sobrenome
     FROM usuarios
     WHERE email = ?`,
    [email]
  );
  const user = rows[0];

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  if (!password) throw new Error('Senha não informada.');

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

    // Remove a senha do objeto user antes de retornar
    const { senha, ...userWithoutPassword } = user;

    const signOptions: SignOptions = {
      expiresIn: authConfig.jwtExpiresIn as any,
    };

    const token = jwt.sign(
      { userId: user.id, ...userWithoutPassword }, // Inclui informações no token
      authConfig.jwtSecret as Secret,
      signOptions
    );

    return { token, user: userWithoutPassword };
  } catch (error) {
    throw new Error('Erro ao validar senha')
  }
  }