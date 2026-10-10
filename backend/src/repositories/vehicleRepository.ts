import { pool } from "../db.js";

export async function findAllVehicles() {
  const result = await pool.query(`
    SELECT
      id,
      code,
      name,
      type,
      status,
      lat,
      lng,
      speed_kmh AS "speedKmH",
      heading,
      telemetry_updated_at AS "telemetryUpdatedAt",
      is_archived AS "isArchived"
    FROM vehicles
    WHERE is_active = TRUE
  AND is_archived = FALSE
ORDER BY id
  `);

  return result.rows;
}

export async function createVehicle(data: {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  telemetry?: {
    lat?: number | null;
    lng?: number | null;
    speedKmH?: number | null;
    heading?: number | null;
    updatedAt?: Date | string | null;
  };
}) {
  const result = await pool.query(
    `
      INSERT INTO vehicles (
        id,
        code,
        name,
        type,
        status,
        lat,
        lng,
        speed_kmh,
        heading,
        telemetry_updated_at,
        is_archived
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        FALSE
      )
      RETURNING
        id,
        code,
        name,
        type,
        status,
        lat,
        lng,
        speed_kmh AS "speedKmH",
        heading,
        telemetry_updated_at AS "telemetryUpdatedAt",
        is_archived AS "isArchived"
    `,
    [
      data.id,
      data.code,
      data.name,
      data.type,
      data.status,
      data.telemetry?.lat ?? null,
      data.telemetry?.lng ?? null,
      data.telemetry?.speedKmH ?? null,
      data.telemetry?.heading ?? null,
      data.telemetry?.updatedAt ?? new Date(),
    ]
  );

  return result.rows[0];
}

export async function updateVehicle(
  id: string,
  data: {
    code: string;
    name: string;
    type: string;
    status: string;
    telemetry?: {
      lat?: number | null;
      lng?: number | null;
      speedKmH?: number | null;
      heading?: number | null;
      updatedAt?: Date | string | null;
    };
    isArchived?: boolean;
  }
) {
  const result = await pool.query(
    `
      UPDATE vehicles
      SET
        code = $1,
        name = $2,
        type = $3,
        status = $4,
        lat = $5,
        lng = $6,
        speed_kmh = $7,
        heading = $8,
        telemetry_updated_at = $9,
        is_archived = COALESCE($10, is_archived)
      WHERE id = $11
      RETURNING
        id,
        code,
        name,
        type,
        status,
        lat,
        lng,
        speed_kmh AS "speedKmH",
        heading,
        telemetry_updated_at AS "telemetryUpdatedAt",
        is_archived AS "isArchived"
    `,
    [
      data.code,
      data.name,
      data.type,
      data.status,
      data.telemetry?.lat ?? null,
      data.telemetry?.lng ?? null,
      data.telemetry?.speedKmH ?? null,
      data.telemetry?.heading ?? null,
      data.telemetry?.updatedAt ?? new Date(),
      typeof data.isArchived === "boolean"
        ? data.isArchived
        : null,
      id,
    ]
  );

  return result.rows[0] ?? null;
}

export async function archiveVehicle(
  id: string,
  isArchived: boolean
) {
  const result = await pool.query(
    `
      UPDATE vehicles
      SET
        is_archived = $1
      WHERE id = $2
      RETURNING
        id,
        code,
        name,
        type,
        status,
        lat,
        lng,
        speed_kmh AS "speedKmH",
        heading,
        telemetry_updated_at AS "telemetryUpdatedAt",
        is_archived AS "isArchived"
    `,
    [isArchived, id]
  );

  return result.rows[0] ?? null;
}

