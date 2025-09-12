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

export default pool;