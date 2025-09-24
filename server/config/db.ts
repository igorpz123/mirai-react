import { createPool, Pool, PoolOptions } from 'mysql2/promise';

// Define as opções de conexão com tipagem
const poolOptions: PoolOptions = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Cria o pool e exporta com tipagem Pool
const pool: Pool = createPool(poolOptions);

// Test connection on startup to provide a clearer error early in Codespaces
;(async () => {
  try {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    console.log('[db] conexão com MySQL estabelecida')
  } catch (err) {
    console.error('[db] não foi possível conectar ao MySQL - verifique variáveis de ambiente e rede')
    console.error(err)
  }
})()

export default pool;