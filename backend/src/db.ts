
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: process.env.DB_PASSWORD,
        database: "geologistics",
      }
);

pool.query("SELECT NOW()")
  .then(() => {
    console.log("PostgreSQL connection: OK");
  })
  .catch((error) => {
    console.error("PostgreSQL connection: FAILED", error.message);
  });


  async function compareLocalData() {
  const result = await pool.query(`
    SELECT id, status
    FROM orders
    ORDER BY id
  `);

  console.log("LOCAL ORDERS:");
  console.table(result.rows);
}

compareLocalData().catch(console.error);

const result = await pool.query(
  `SELECT *
   FROM vehicles
   WHERE id = $1`,
  ["vehicle-1792081312950"]
);

console.table(result.rows);