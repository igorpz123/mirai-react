// server/services/userService.ts
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import usuario from '../config/auth';

export const getUsersByDepartmentAndUnit = async (
    departmentId: number,
    unitId: number
) => {
    const users = await db.query(
        `SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE uu.unidade_id IN (?)
              AND us.setor_id IN (?)
              AND u.status = 'ativo'
        GROUP BY u.id
        ORDER BY u.nome ASC`,
            // corrigir ordem: primeiro unidade, depois setor
            [unitId, departmentId]
    );

    return users;
};