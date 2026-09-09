import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load server/.env regardless of the process cwd.
dotenv.config({ path: path.join(__dirname, '.env') });

const env = process.env;
export const DB_NAME = env.DB_NAME || 'mahindra_i2p';

const baseOpts = {
  host: env.DB_HOST || 'localhost',
  port: Number(env.DB_PORT) || 3306,
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
};

// Pool WITHOUT a database selected — used to create the schema.
export const rootPool = mysql.createPool({ ...baseOpts, connectionLimit: 5, multipleStatements: true });

// Pool WITH the app database selected — used by every route.
export const pool = mysql.createPool({ ...baseOpts, database: DB_NAME });

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function withConn(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function closePools() {
  await Promise.allSettled([pool.end(), rootPool.end()]);
}
