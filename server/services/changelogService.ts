import pool from '../config/db'

export type ChangelogItem = {
  id: number
  title: string
  body: string
  version: string | null
  created_at: string
  author_id: number | null
  author_name?: string | null
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS changelog (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      version VARCHAR(50) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      author_id INT NULL,
      INDEX (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function listChangelog(limit = 100): Promise<ChangelogItem[]> {
  await ensureTable()
  const [rows] = await pool.query(
    `SELECT c.*, u.nome AS author_name
     FROM changelog c
     LEFT JOIN usuarios u ON u.id = c.author_id
     ORDER BY c.created_at DESC
     LIMIT ?`,
    [Math.max(1, Math.min(500, limit))]
  ) as [any[], any]
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    body: r.body,
    version: r.version,
    created_at: (r.created_at instanceof Date) ? r.created_at.toISOString() : r.created_at,
    author_id: r.author_id ?? null,
    author_name: r.author_name ?? null,
  }))
}

export async function createChangelog(entry: { title: string; body: string; version?: string | null; author_id?: number | null }): Promise<ChangelogItem> {
  await ensureTable()
  const { title, body, version = null, author_id = null } = entry
  const [res] = await pool.query(
    'INSERT INTO changelog (title, body, version, author_id) VALUES (?, ?, ?, ?)',
    [title, body, version, author_id]
  ) as [any, any]
  const id = res.insertId as number
  const [rows] = await pool.query(
    `SELECT c.*, u.nome AS author_name FROM changelog c LEFT JOIN usuarios u ON u.id = c.author_id WHERE c.id = ?`,
    [id]
  ) as [any[], any]
  const r = rows[0]
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    version: r.version,
    created_at: (r.created_at instanceof Date) ? r.created_at.toISOString() : r.created_at,
    author_id: r.author_id ?? null,
    author_name: r.author_name ?? null,
  }
}

export async function isAdminUser(userId: number): Promise<boolean> {
  try {
    // Use the real DB column name and alias for consistency
    const [rows] = await pool.query('SELECT cargo_id AS cargoId FROM usuarios WHERE id = ? LIMIT 1', [userId]) as [any[], any]
    const cargoId = rows?.[0]?.cargoId
    // Only cargo_id === 1 can publish changelog
    return Number(cargoId) === 1
  } catch {
    return false
  }
}

export default { listChangelog, createChangelog, isAdminUser }
