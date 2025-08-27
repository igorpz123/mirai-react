// server/services/authService.ts
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import authConfig from '../config/auth';

interface DbUserRow extends RowDataPacket {
  id: number;
  email: string;
  senha: string;
  nome: string;
  sobrenome: string | null;
  cargoId: number;
  cargo: string;
  fotoUrl: string | null;
  unidadeIds: string; // JSON_ARRAYAGG vem como string
  setorIds: string;
}

export interface User {
  id: number;
  email: string;
  nome: string;
  sobrenome?: string;
  cargoId: number;
  cargo: string;
  fotoUrl?: string;
  unidades: Unidade[];
  setores: Setor[];
}

export interface Unidade {
  id: number;
  nome: string;
}

export interface Setor {
  id: number;
  nome: string;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  // 1) Busca tudo de uma vez
  const [rows] = await db.query<DbUserRow[]>(
    `
    SELECT
      u.id,
      u.email,
      u.senha,
      u.nome,
      u.sobrenome,
      u.cargo_id     AS cargoId,
      c.nome         AS cargo,
      u.foto_url     AS fotoUrl,
      JSON_ARRAYAGG(
        DISTINCT JSON_OBJECT(
          'id', uu.unidade_id,
          'nome', un.nome
        )
      ) AS unidades,
      JSON_ARRAYAGG(
        DISTINCT JSON_OBJECT(
          'id', us.setor_id,
          'nome', ss.nome
        )
      ) AS setores
      FROM usuarios u
      LEFT JOIN cargos c            ON u.cargo_id    = c.id
      LEFT JOIN usuario_unidades uu ON uu.usuario_id  = u.id
      LEFT JOIN unidades un         ON uu.unidade_id  = un.id
      LEFT JOIN usuario_setores  us ON us.usuario_id  = u.id
      LEFT JOIN setores ss         ON us.setor_id     = ss.id
      WHERE u.email = ?
        AND u.status = 'ativo'
      GROUP BY
        u.id, u.email, u.senha, u.nome, u.sobrenome,
        u.cargo_id, c.nome, u.foto_url;
      `,
    [email]
  );

  if (!rows.length) {
    throw new Error('Usuário não encontrado ou inativo.');
  }
  const raw = rows[0];

  if (!password) {
    throw new Error('Senha não informada.');
  }

  // 2) Ajuste hash se necessário (de $2y$ para $2a$)
  let hash = raw.senha;
  if (hash.startsWith('$2y$')) {
    hash = '$2a$' + hash.slice(4);
  }

  // 3) Verifica senha
  const match = await bcrypt.compare(password, hash);
  if (!match) {
    throw new Error('Senha inválida.');
  }

  // 4) Parse dos arrays retornados como JSON strings
  const unidades: Unidade[] = JSON.parse(raw.unidades) as Unidade[];
  const setores: Setor[] = JSON.parse(raw.setores) as Setor[];

  // 5) Monta o usuário sem a senha
  const user: User = {
    id: raw.id,
    email: raw.email,
    nome: raw.nome,
    sobrenome: raw.sobrenome ?? undefined,
    cargoId: raw.cargoId,
    cargo: raw.cargo,
    fotoUrl: raw.fotoUrl ?? undefined,
    unidades,
    setores,
  };

  // 6) Gera o JWT
  const signOptions: SignOptions = { expiresIn: authConfig.jwtExpiresIn as any };
  const token = jwt.sign(
    { userId: user.id, ...user },
    authConfig.jwtSecret as Secret,
    signOptions
  );

  return { token, user };
}