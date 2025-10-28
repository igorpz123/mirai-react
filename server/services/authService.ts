// server/services/authService.ts
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import authConfig from '../config/auth';
import * as permissionService from './permissionService';

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
  permissions?: string[]; // Array de permissões: ['admin', 'comercial', 'tecnico']
}

export interface Unidade {
  id: number;
  nome: string;
}

export interface Setor {
  id: number;
  nome: string;
}

/** Recupera o usuário (com unidades e setores) pelo ID sem exigir senha */
export async function getUserById(id: number): Promise<User | null> {
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
      CONCAT(
        '[',
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', uu.unidade_id,
            ',"nome":"', REPLACE(un.nome, '"', '\\"'), '"}'
          )
          ORDER BY uu.unidade_id
          SEPARATOR ','
        ),
        ']'
      ) AS unidades,
      CONCAT(
        '[',
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', us.setor_id,
            ',"nome":"', REPLACE(ss.nome, '"', '\\"'), '"}'
          )
          ORDER BY us.setor_id
          SEPARATOR ','
        ),
        ']'
      ) AS setores
    FROM usuarios u
      LEFT JOIN cargos c            ON u.cargo_id    = c.id
      LEFT JOIN usuario_unidades uu ON uu.usuario_id  = u.id
      LEFT JOIN unidades un         ON uu.unidade_id  = un.id
      LEFT JOIN usuario_setores  us ON us.usuario_id  = u.id
      LEFT JOIN setor ss         ON us.setor_id     = ss.id
    WHERE u.id = ? AND u.status = 'ativo'
    GROUP BY u.id, u.email, u.senha, u.nome, u.sobrenome,
             u.cargo_id, c.nome, u.foto_url;
    `,
    [id]
  )
  if (!rows.length) return null
  const raw = rows[0]
  const unidades: Unidade[] = JSON.parse(raw.unidades || '[]')
  const setores: Setor[] = JSON.parse(raw.setores || '[]')
  return {
    id: raw.id,
    email: raw.email,
    nome: raw.nome,
    sobrenome: raw.sobrenome ?? undefined,
    cargoId: raw.cargoId,
    cargo: raw.cargo,
    fotoUrl: raw.fotoUrl ?? undefined,
    unidades,
    setores
  }
}

export function signUserToken(user: User): string {
  const signOptions: SignOptions = { expiresIn: authConfig.jwtExpiresIn as any };
  return jwt.sign(
    { userId: user.id, ...user },
    authConfig.jwtSecret as Secret,
    signOptions
  );
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
      CONCAT(
        '[',
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', uu.unidade_id,
            ',"nome":"', REPLACE(un.nome, '"', '\\"'), '"}'
          )
          ORDER BY uu.unidade_id
          SEPARATOR ','
        ),
        ']'
      ) AS unidades,

      -- Monta a array JSON de setores
      CONCAT(
        '[',
        GROUP_CONCAT(
          DISTINCT CONCAT(
            '{"id":', us.setor_id,
            ',"nome":"', REPLACE(ss.nome, '"', '\\"'), '"}'
          )
          ORDER BY us.setor_id
          SEPARATOR ','
        ),
        ']'
      ) AS setores
        FROM usuarios u
      LEFT JOIN cargos c            ON u.cargo_id    = c.id
      LEFT JOIN usuario_unidades uu ON uu.usuario_id  = u.id
      LEFT JOIN unidades un         ON uu.unidade_id  = un.id
      LEFT JOIN usuario_setores  us ON us.usuario_id  = u.id
      LEFT JOIN setor ss         ON us.setor_id     = ss.id
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

  // 5) Buscar permissões do usuário
  const userPermissions = await permissionService.getUserPermissions(raw.id);

  // 6) Monta o usuário sem a senha
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
    permissions: userPermissions.permissions,
  };

  // 7) Gera o JWT
  const token = signUserToken(user)

  return { token, user };
}