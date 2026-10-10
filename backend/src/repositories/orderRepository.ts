import type { PoolClient } from "pg";


// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

export async function findOrders(
  client: PoolClient,
) {
  const result = await client.query(`
    SELECT
      o.id,
      o.client_id AS "clientId",
      o.status,
      da.address,
      o.eta,
      o.vehicle_id AS "vehicleId",
      o.driver_id AS "driverId"
    FROM orders o
    JOIN delivery_addresses da
      ON da.id = o.delivery_address_id
    ORDER BY o.id
  `);

  return result.rows;
}


export async function findClientById(
  client: PoolClient,
  clientId: string,
) {
  const result = await client.query(
    `
      SELECT id
      FROM clients
      WHERE id = $1
    `,
    [clientId],
  );

  return result.rows[0] ?? null;
}


// -----------------------------------------------------------------------------
// Vehicle
// -----------------------------------------------------------------------------

export async function lockVehicle(
  client: PoolClient,
  vehicleId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        status
      FROM vehicles
      WHERE id = $1
      FOR UPDATE
    `,
    [vehicleId],
  );

  return result.rows[0] ?? null;
}


export async function findActiveVehicleOrder(
  client: PoolClient,
  vehicleId: string,
  excludeOrderId?: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        status
      FROM orders
      WHERE vehicle_id = $1
        ${
          excludeOrderId
            ? "AND id <> $2"
            : ""
        }
        AND status IN (
          'assigned',
          'in-progress',
          'delayed'
        )
      LIMIT 1
    `,
    excludeOrderId
      ? [vehicleId, excludeOrderId]
      : [vehicleId],
  );

  return result.rows[0] ?? null;
}


export async function setVehicleStatus(
  client: PoolClient,
  vehicleId: string,
  status: string,
  lat?: number,
  lng?: number,
) {
  if (
    lat !== undefined &&
    lng !== undefined
  ) {
    await client.query(
      `
        UPDATE vehicles
        SET
          status = $1,
          lat = $2,
          lng = $3,
          speed_kmh = 0,
          telemetry_updated_at = NOW()
        WHERE id = $4
      `,
      [
        status,
        lat,
        lng,
        vehicleId,
      ],
    );

    return;
  }

  await client.query(
    `
      UPDATE vehicles
      SET
        status = $1,
        speed_kmh = 0,
        telemetry_updated_at = NOW()
      WHERE id = $2
    `,
    [
      status,
      vehicleId,
    ],
  );
}


// -----------------------------------------------------------------------------
// Driver
// -----------------------------------------------------------------------------

export async function lockDriver(
  client: PoolClient,
  driverId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        status,
        vehicle_id AS "vehicleId"
      FROM drivers
      WHERE id = $1
      FOR UPDATE
    `,
    [driverId],
  );

  return result.rows[0] ?? null;
}


export async function findActiveDriverOrder(
  client: PoolClient,
  driverId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        status
      FROM orders
      WHERE driver_id = $1
        AND status IN (
          'assigned',
          'in-progress',
          'delayed'
        )
      LIMIT 1
    `,
    [driverId],
  );

  return result.rows[0] ?? null;
}


export async function setDriverStatus(
  client: PoolClient,
  driverId: string,
  status: string,
) {
  await client.query(
    `
      UPDATE drivers
      SET
        status = $1
      WHERE id = $2
    `,
    [
      status,
      driverId,
    ],
  );
}


// -----------------------------------------------------------------------------
// Delivery address
// -----------------------------------------------------------------------------

export async function createDeliveryAddress(
  client: PoolClient,
  address: string,
  latitude: number,
  longitude: number,
) {
  const result = await client.query(
    `
      INSERT INTO delivery_addresses (
        address,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        address,
        latitude,
        longitude
    `,
    [
      address,
      latitude,
      longitude,
    ],
  );

  return result.rows[0];
}


export async function findDeliveryAddress(
  client: PoolClient,
  addressId: number,
) {
  const result = await client.query(
    `
      SELECT
        address,
        latitude,
        longitude
      FROM delivery_addresses
      WHERE id = $1
    `,
    [addressId],
  );

  return result.rows[0] ?? null;
}


export async function updateDeliveryAddress(
  client: PoolClient,
  addressId: number,
  address: string,
  latitude: number,
  longitude: number,
) {
  await client.query(
    `
      UPDATE delivery_addresses
      SET
        address = $1,
        latitude = $2,
        longitude = $3
      WHERE id = $4
    `,
    [
      address,
      latitude,
      longitude,
      addressId,
    ],
  );
}


// -----------------------------------------------------------------------------
// Create order
// -----------------------------------------------------------------------------

export async function createOrder(
  client: PoolClient,
  orderId: string,
  clientId: string,
  deliveryAddressId: number,
  driverId: string,
  vehicleId: string,
  status: string,
  eta: string,
) {
  const result = await client.query(
    `
      INSERT INTO orders (
        id,
        client_id,
        delivery_address_id,
        driver_id,
        vehicle_id,
        status,
        eta
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING
        id,
        client_id AS "clientId",
        delivery_address_id AS "deliveryAddressId",
        driver_id AS "driverId",
        vehicle_id AS "vehicleId",
        status,
        eta
    `,
    [
      orderId,
      clientId,
      deliveryAddressId,
      driverId,
      vehicleId,
      status,
      eta,
    ],
  );

  return result.rows[0];
}


// -----------------------------------------------------------------------------
// Find / lock order
// -----------------------------------------------------------------------------

export async function findOrderForUpdate(
  client: PoolClient,
  orderId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        client_id AS "clientId",
        delivery_address_id AS "deliveryAddressId",
        driver_id AS "driverId",
        vehicle_id AS "vehicleId",
        status,
        eta
      FROM orders
      WHERE id = $1
      FOR UPDATE
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}


export async function findOrderForEdit(
  client: PoolClient,
  orderId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        status,
        delivery_address_id AS "deliveryAddressId",
        vehicle_id AS "vehicleId"
      FROM orders
      WHERE id = $1
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}


// -----------------------------------------------------------------------------
// Update order
// -----------------------------------------------------------------------------

export async function updateOrder(
  client: PoolClient,
  orderId: string,
  clientId: string,
  eta: string,
) {
  const result = await client.query(
    `
      UPDATE orders
      SET
        client_id = $1,
        eta = $2
      WHERE id = $3
      RETURNING
        id,
        client_id AS "clientId",
        delivery_address_id AS "deliveryAddressId",
        vehicle_id AS "vehicleId",
        status,
        eta
    `,
    [
      clientId,
      eta,
      orderId,
    ],
  );

  return result.rows[0] ?? null;
}


// -----------------------------------------------------------------------------
// Order status
// -----------------------------------------------------------------------------

export async function updateOrderStatus(
  client: PoolClient,
  orderId: string,
  status: string,
) {
  await client.query(
    `
      UPDATE orders
      SET
        status = $1
      WHERE id = $2
    `,
    [
      status,
      orderId,
    ],
  );
}


// -----------------------------------------------------------------------------
// Delivery route
// -----------------------------------------------------------------------------

export async function findActiveDeliveryRoute(
  client: PoolClient,
  orderId: string,
) {
  const result = await client.query(
    `
      SELECT id
      FROM delivery_routes
      WHERE order_id = $1
        AND completed_at IS NULL
      LIMIT 1
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}


export async function createDeliveryRoute(
  client: PoolClient,
  params: {
    orderId: string;
    vehicleId: string;
    driverId: string;

    startLat: number;
    startLng: number;

    finishLat: number;
    finishLng: number;

    path: [number, number][];
  },
) {
  await client.query(
    `
      INSERT INTO delivery_routes (
        order_id,
        vehicle_id,
        driver_id,
        start_lat,
        start_lng,
        finish_lat,
        finish_lng,
        path,
        current_path_index,
        completed_path,
        last_progress_at
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
        0,
        $9::jsonb,
        NOW()
      )
    `,
    [
      params.orderId,
      params.vehicleId,
      params.driverId,

      params.startLat,
      params.startLng,

      params.finishLat,
      params.finishLng,

      JSON.stringify(params.path),

      JSON.stringify([
        params.path[0],
      ]),
    ],
  );
}


export async function findLatestDeliveryRoute(
  client: PoolClient,
  orderId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        order_id AS "orderId",
        vehicle_id AS "vehicleId",
        driver_id AS "driverId",

        start_lat AS "startLat",
        start_lng AS "startLng",

        finish_lat AS "finishLat",
        finish_lng AS "finishLng",

        path,
        current_path_index AS "currentPathIndex",
        completed_path AS "completedPath",

        started_at AS "startedAt",
        last_progress_at AS "lastProgressAt",
        completed_at AS "completedAt"

      FROM delivery_routes

      WHERE order_id = $1

      ORDER BY id DESC

      LIMIT 1
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}


export async function findLatestDeliveryRouteForUpdate(
  client: PoolClient,
  orderId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        order_id AS "orderId",
        vehicle_id AS "vehicleId",
        driver_id AS "driverId",

        start_lat AS "startLat",
        start_lng AS "startLng",

        finish_lat AS "finishLat",
        finish_lng AS "finishLng",

        path,
        current_path_index AS "currentPathIndex",

        started_at AS "startedAt",
        last_progress_at AS "lastProgressAt",
        completed_at AS "completedAt"

      FROM delivery_routes

      WHERE order_id = $1

      ORDER BY id DESC

      LIMIT 1

      FOR UPDATE
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}


export async function findDeliveryRoutes(
  client: PoolClient,
) {
  const result = await client.query(`
    SELECT
      id,
      order_id AS "orderId",
      vehicle_id AS "vehicleId",
      driver_id AS "driverId",

      start_lat AS "startLat",
      start_lng AS "startLng",

      finish_lat AS "finishLat",
      finish_lng AS "finishLng",

      path,
      current_path_index AS "currentPathIndex",

      started_at AS "startedAt",
      last_progress_at AS "lastProgressAt",
      completed_at AS "completedAt"

    FROM delivery_routes

    WHERE completed_at IS NULL

    ORDER BY id
  `);

  return result.rows;
}


export async function findHistoryDeliveryRoutes(
  client: PoolClient,
) {
  const result = await client.query(`
    SELECT
      id,
      order_id AS "orderId",
      vehicle_id AS "vehicleId",
      driver_id AS "driverId",

      start_lat AS "startLat",
      start_lng AS "startLng",

      finish_lat AS "finishLat",
      finish_lng AS "finishLng",

      path,
      current_path_index AS "currentPathIndex",

      started_at AS "startedAt",
      last_progress_at AS "lastProgressAt",
      completed_at AS "completedAt"

    FROM delivery_routes

    WHERE completed_at IS NOT NULL

    ORDER BY completed_at DESC
  `);

  return result.rows;
}

// -----------------------------------------------------------------------------
// Delivery progress
// -----------------------------------------------------------------------------

export async function updateDeliveryRouteProgress(
  client: PoolClient,
  routeId: number,
  currentPathIndex: number,
  completedPath: [number, number][],
  lastProgressAt: Date,
) {
  await client.query(
    `
      UPDATE delivery_routes
      SET
        current_path_index = $1,
        completed_path = $2::jsonb,
        last_progress_at = $3
      WHERE id = $4
    `,
    [
      currentPathIndex,
      JSON.stringify(completedPath),
      lastProgressAt,
      routeId,
    ],
  );
}


export async function completeDeliveryRoute(
  client: PoolClient,
  routeId: number,
  currentPathIndex: number,
  completedPath: [number, number][],
  lastProgressAt: Date,
) {
  await client.query(
    `
      UPDATE delivery_routes
      SET
        current_path_index = $1,
        completed_path = $2::jsonb,
        last_progress_at = $3,
        completed_at = NOW()
      WHERE id = $4
    `,
    [
      currentPathIndex,
      JSON.stringify(completedPath),
      lastProgressAt,
      routeId,
    ],
  );
}


export async function findUpdatedDeliveryRoute(
  client: PoolClient,
  routeId: number,
) {
  const result = await client.query(
    `
      SELECT
        id,
        order_id AS "orderId",
        vehicle_id AS "vehicleId",
        driver_id AS "driverId",

        current_path_index AS "currentPathIndex",

        started_at AS "startedAt",
        last_progress_at AS "lastProgressAt",
        completed_at AS "completedAt"

      FROM delivery_routes

      WHERE id = $1
    `,
    [routeId],
  );

  return result.rows[0] ?? null;
}


// -----------------------------------------------------------------------------
// Assign vehicle
// -----------------------------------------------------------------------------

export async function updateOrderVehicle(
  client: PoolClient,
  orderId: string,
  vehicleId: string,
) {
  const result = await client.query(
    `
      UPDATE orders
      SET vehicle_id = $1
      WHERE id = $2
      RETURNING
        id,
        client_id AS "clientId",
        delivery_address_id AS "deliveryAddressId",
        driver_id AS "driverId",
        vehicle_id AS "vehicleId",
        status,
        eta
    `,
    [
      vehicleId,
      orderId,
    ],
  );

  return result.rows[0] ?? null;
}