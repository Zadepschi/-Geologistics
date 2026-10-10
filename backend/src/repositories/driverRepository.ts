import { pool } from "../db.js";

export async function getDrivers() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      phone,
      status,
      vehicle_id AS "vehicleId",
      is_archived AS "isArchived"
    FROM drivers
    ORDER BY id
  `);

  return result.rows;
}

export async function createDriver(data: {
  id: string;
  name: string;
  phone: string;
  status: string;
  vehicleId?: string | null;
}) {
  const result = await pool.query(
    `
      INSERT INTO drivers (
        id,
        name,
        phone,
        status,
        vehicle_id,
        is_archived
      )
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING
        id,
        name,
        phone,
        status,
        vehicle_id AS "vehicleId",
        is_archived AS "isArchived"
    `,
    [
      data.id,
      data.name,
      data.phone,
      data.status,
      data.vehicleId || null,
    ]
  );

  return result.rows[0];
}

export async function updateDriver(
  id: string,
  data: {
    name: string;
    phone: string;
    status: string;
    vehicleId?: string | null;
    isArchived?: boolean;
  }
) {
  const result = await pool.query(
    `
      UPDATE drivers
      SET
        name = $1,
        phone = $2,
        status = $3,
        vehicle_id = $4,
        is_archived = COALESCE($5, is_archived)
      WHERE id = $6
      RETURNING
        id,
        name,
        phone,
        status,
        vehicle_id AS "vehicleId",
        is_archived AS "isArchived"
    `,
    [
      data.name,
      data.phone,
      data.status,
      data.vehicleId || null,
      typeof data.isArchived === "boolean"
        ? data.isArchived
        : null,
      id,
    ]
  );

  return result.rows[0] ?? null;
}

export async function archiveDriver(
  id: string,
  isArchived: boolean
) {
  const result = await pool.query(
    `
      UPDATE drivers
      SET
        is_archived = $1
      WHERE id = $2
      RETURNING
        id,
        name,
        phone,
        status,
        vehicle_id AS "vehicleId",
        is_archived AS "isArchived"
    `,
    [isArchived, id]
  );

  return result.rows[0] ?? null;
}