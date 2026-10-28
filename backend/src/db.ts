
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const useLocalDatabase = process.env.USE_LOCAL_DATABASE === "true";

const connectionString = useLocalDatabase
  ? undefined
  : process.env.DATABASE_URL;

if (!useLocalDatabase && !connectionString) {
  throw new Error(
    "DATABASE_URL is required unless USE_LOCAL_DATABASE=true"
  );
}

export const pool = new Pool(
  useLocalDatabase
    ? {
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: process.env.DB_PASSWORD,
        database: "geologistics",
      }
    : {
        connectionString,
        ssl: { rejectUnauthorized: false },
      }
);

pool.query("SELECT NOW()")
  .then(() => {
    console.log(
      `PostgreSQL connection: OK (${useLocalDatabase ? "LOCAL" : "REMOTE"})`
    );
  })
  .catch((error) => {
    console.error("PostgreSQL connection: FAILED", error.message);
  });
