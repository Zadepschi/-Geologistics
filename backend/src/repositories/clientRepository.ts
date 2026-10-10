import { pool } from "../db.js";

export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  isArchived: boolean;
}

export async function getAllClients(): Promise<ClientRecord[]> {
  const result = await pool.query<ClientRecord>(`
    SELECT
      id,
      name,
      phone,
      email,
      address,
      is_archived AS "isArchived"
    FROM clients
    ORDER BY id
  `);

  return result.rows;
}

export async function createClient(data: {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}): Promise<ClientRecord> {
  const result = await pool.query<ClientRecord>(
    `
      INSERT INTO clients (
        id,
        name,
        phone,
        email,
        address,
        is_archived
      )
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING
        id,
        name,
        phone,
        email,
        address,
        is_archived AS "isArchived"
    `,
    [
      data.id,
      data.name,
      data.phone,
      data.email,
      data.address,
    ],
  );

  return result.rows[0];
}

export async function updateClient(
  id: string,
  data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    isArchived?: boolean;
  },
): Promise<ClientRecord | null> {
  const result = await pool.query<ClientRecord>(
    `
      UPDATE clients
      SET
        name = $1,
        phone = $2,
        email = $3,
        address = $4,
        is_archived = COALESCE($5, is_archived)
      WHERE id = $6
      RETURNING
        id,
        name,
        phone,
        email,
        address,
        is_archived AS "isArchived"
    `,
    [
      data.name,
      data.phone,
      data.email,
      data.address,
      typeof data.isArchived === "boolean"
        ? data.isArchived
        : null,
      id,
    ],
  );

  return result.rows[0] ?? null;
}

export async function archiveClient(
  id: string,
  isArchived: boolean,
): Promise<ClientRecord | null> {
  const result = await pool.query<ClientRecord>(
    `
      UPDATE clients
      SET
        is_archived = $1
      WHERE id = $2
      RETURNING
        id,
        name,
        phone,
        email,
        address,
        is_archived AS "isArchived"
    `,
    [isArchived, id],
  );

  return result.rows[0] ?? null;
}