import mysql from "mysql2/promise";
import dotenv from "dotenv";

import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 8889,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
};

const pool = mysql.createPool(dbConfig);

export async function closePool() {
  try {
    await pool.end();
    console.log("データベース接続プールを破棄しました。");
  } catch (err) {
    console.error(
      "データベース接続プールの破棄中にエラーが発生しました：",
      err,
    );
  }
}

export async function query<T = any>(sql: string, params: any[] = []) {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows as T[];
  } catch (err) {
    console.error("SQLの実行中にエラーが発生しました：", err);
    throw err;
  }
}

// SQL文を実行する関数(INSERT, UPDATE, DEELETE)
export async function exec(sql: string, params: any[] = []) {
  try {
    const [result] = await pool.execute<ResultSetHeader>(sql, params);
    return result;
  } catch (err) {
    console.error("SQLの実行中にエラーが発生しました：", err);
    throw err;
  }
}
