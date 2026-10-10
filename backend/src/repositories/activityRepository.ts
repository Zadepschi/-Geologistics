import type { PoolClient } from "pg";

export type CreateActivityInput = {
  type: string;
  title: string;
  description: string;
  orderId?: string;
  vehicleId?: string;
};

/**
 * Сохраняет событие в PostgreSQL.
 * Использует текущую транзакцию, переданную из сервиса.
 */
export async function createActivity(
  client: PoolClient,
  input: CreateActivityInput,
) {
  await client.query(
    `
      INSERT INTO activity_events (
        type,
        title,
        description,
        order_id,
        vehicle_id
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      input.type,
      input.title,
      input.description,
      input.orderId ?? null,
      input.vehicleId ?? null,
    ],
  );
}

/**
 * Возвращает последние события.
 * Новые события идут первыми.
 */
export async function findRecentActivities(
  client: PoolClient,
  limit = 20,
) {
  const result = await client.query(
    `
      SELECT
        id,
        type,
        title,
        description,
        order_id AS "orderId",
        vehicle_id AS "vehicleId",
        created_at AS "createdAt"
      FROM activity_events
      ORDER BY created_at DESC, id DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows;
}