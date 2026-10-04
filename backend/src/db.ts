import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: process.env.DB_PASSWORD,
  database: "geologistics",
});


pool.query("SELECT NOW()")
  .then(() => {
    console.log("PostgreSQL connection: OK");
  })
  .catch((error) => {
    console.error("PostgreSQL connection: FAILED", error);
  });