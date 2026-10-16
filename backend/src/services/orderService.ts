import crypto from "crypto";

import type { PoolClient } from "pg";

import { pool } from "../db.js";
import {
  allowedOrderTransitions,
  type OrderStatus,
} from "../types/orders.js";

import {
  findOrders,
  findClientById,
  lockVehicle,
  findActiveVehicleOrder,
  setVehicleStatus,
  lockDriver,
  findActiveDriverOrder,
  setDriverStatus,
  createDeliveryAddress,
  findDeliveryAddress,
  updateDeliveryAddress,
  createOrder as createOrderRepository,
  findOrderForUpdate,
  findOrderForEdit,
  updateOrder as updateOrderRepository,
  updateOrderStatus as updateOrderStatusRepository,
  findActiveDeliveryRoute,
  createDeliveryRoute,
  findLatestDeliveryRoute,
  findLatestDeliveryRouteForUpdate,
  findDeliveryRoutes,
  findHistoryDeliveryRoutes,
  updateDeliveryRouteProgress,
  completeDeliveryRoute,
  findUpdatedDeliveryRoute,
  updateOrderVehicle,
} from "../repositories/orderRepository.js";

import {
  createActivity,
} from "../repositories/activityRepository.js";


async function createNotification(
  client: PoolClient,
  text: string,
) {
  await client.query(
    `
      INSERT INTO notifications (text, read)
      VALUES ($1, FALSE)
    `,
    [text],
  );
}

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

type CreateOrderInput = {
  clientId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  vehicleId?: string;
  driverId?: string;
  eta?: string;
};

type UpdateOrderInput = {
  clientId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  eta?: string;
};

type UpdateOrderStatusInput = {
  status?: OrderStatus;
  route?: {
    start?: [number, number];
    finish?: [number, number];
    path?: [number, number][];
  };
};

type AssignVehicleInput = {
  vehicleId?: string;
};

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}


type Coordinate = [number, number]; // [longitude, latitude]

const SIMULATION_SPEED_KMH = 160;
const EARTH_RADIUS_KM = 6371;

function distanceBetweenPointsKm(
  a: Coordinate,
  b: Coordinate,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const [lon1, lat1] = a.map(toRad);
  const [lon2, lat2] = b.map(toRad);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM *
    Math.asin(Math.sqrt(Math.min(1, h)));
}


function segmentTravelMs(
  a: Coordinate,
  b: Coordinate,
): number {
  const distanceKm = distanceBetweenPointsKm(a, b);

  return Math.max(
    1,
    Math.ceil(
      (distanceKm / SIMULATION_SPEED_KMH) *
        60 *
        60 *
        1000,
    ),
  );
}

function remainingTravelMs(
  path: Coordinate[],
  currentPathIndex: number,
): number {
  if (path.length < 2) {
    return 0;
  }

  const start = Math.max(
    0,
    Math.min(currentPathIndex, path.length - 1),
  );

  let duration = 0;

  for (let i = start; i < path.length - 1; i++) {
    duration += segmentTravelMs(path[i], path[i + 1]);
  }

  return duration;
}


function estimateTravelMs(distanceKm: number): number {
  return (distanceKm / SIMULATION_SPEED_KMH) * 60 * 60 * 1000;
}


function validateCreateOrderInput(input: CreateOrderInput) {
  if (
    !input.clientId ||
    !input.address ||
    !isValidCoordinate(input.latitude) ||
    !isValidCoordinate(input.longitude) ||
    !input.vehicleId ||
    !input.driverId ||
    !input.eta
  ) {
    throw new OrderServiceError(
      "clientId, address, latitude, longitude, vehicleId, driverId and eta are required",
      400,
    );
  }
}

function validateUpdateOrderInput(input: UpdateOrderInput) {
  if (
    !input.clientId ||
    !input.address ||
    !isValidCoordinate(input.latitude) ||
    !isValidCoordinate(input.longitude) ||
    !input.eta
  ) {
    throw new OrderServiceError(
      "clientId, address, latitude, longitude and eta are required",
      400,
    );
  }
}

function validateOrderStatus(status: unknown): status is OrderStatus {
  return (
    status === "in-progress" ||
    status === "completed" ||
    status === "delayed"
  );
}

function createOrderResponse(
  order: any,
  deliveryAddress: any,
) {
  return {
    id: order.id,
    clientId: order.clientId,
    status: order.status,
    address: deliveryAddress?.address ?? "—",
    eta: order.eta ?? "—",
    vehicleId: order.vehicleId,
    driverId: order.driverId,
    deliveryAddress: {
      id: order.deliveryAddressId ?? deliveryAddress?.id,
      latitude: deliveryAddress?.latitude ?? null,
      longitude: deliveryAddress?.longitude ?? null,
    },
  };
}

function createDeliveryRouteResponse(route: any) {
  if (!route) {
    return null;
  }

  return {
    id: route.id,
    orderId: route.orderId,
    vehicleId: route.vehicleId,
    driverId: route.driverId,
    start: [route.startLng, route.startLat],
    finish: [route.finishLng, route.finishLat],
    path: route.path,
    currentPathIndex: route.currentPathIndex,
    completedPath: route.completedPath,
    startedAt: route.startedAt,
    lastProgressAt: route.lastProgressAt,
    completedAt: route.completedAt,
  };
}

// -----------------------------------------------------------------------------
// GET ORDERS
// -----------------------------------------------------------------------------

export async function listOrders() {
  return findOrders(pool as unknown as PoolClient);
}

// -----------------------------------------------------------------------------
// CREATE ORDER
// -----------------------------------------------------------------------------

export async function createOrder(input: CreateOrderInput) {
  validateCreateOrderInput(input);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const clientRecord = await findClientById(
      client,
      input.clientId!,
    );

    if (!clientRecord) {
      throw new OrderServiceError(
        "Client not found",
        404,
      );
    }

    // Блокируем машину.
    const vehicle = await lockVehicle(
      client,
      input.vehicleId!,
    );

    if (!vehicle) {
      throw new OrderServiceError(
        "Vehicle not found",
        404,
      );
    }

    if (vehicle.status !== "idle") {
      throw new OrderServiceError(
        "Vehicle is not available",
        409,
      );
    }

    const activeVehicleOrder =
      await findActiveVehicleOrder(
        client,
        input.vehicleId!,
      );

    if (activeVehicleOrder) {
      throw new OrderServiceError(
        "Vehicle is already assigned to an active order",
        409,
      );
    }

    // Блокируем водителя.
    const driver = await lockDriver(
      client,
      input.driverId!,
    );

    if (!driver) {
      throw new OrderServiceError(
        "Driver not found",
        404,
      );
    }

    if (driver.status !== "available") {
      throw new OrderServiceError(
        "Driver is not available",
        409,
      );
    }

    if (
      driver.vehicleId &&
      driver.vehicleId !== input.vehicleId
    ) {
      throw new OrderServiceError(
        "Selected driver is assigned to another vehicle",
        409,
      );
    }

    const activeDriverOrder =
      await findActiveDriverOrder(
        client,
        input.driverId!,
      );

    if (activeDriverOrder) {
      throw new OrderServiceError(
        "Driver is already assigned to an active order",
        409,
      );
    }

    // Создаём адрес доставки.
    const deliveryAddress =
      await createDeliveryAddress(
        client,
        input.address!,
        input.latitude!,
        input.longitude!,
      );

    // Создаём заказ.
    const orderId = `ORD-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)}`;

    const order = await createOrderRepository(
      client,
      orderId,
      input.clientId!,
      deliveryAddress.id,
      input.driverId!,
      input.vehicleId!,
      "assigned",
      input.eta!,
    );

    await createActivity(client, {
  type: "order_created",
  title: "Order created",
  description: `Order ${order.id} was created`,
  orderId: order.id,
  vehicleId: input.vehicleId,
});


await createNotification(
  client,
  `Shipment created: order ${order.id}`,
);

    // Машина становится закреплённой за заказом.
    await setVehicleStatus(
      client,
      input.vehicleId!,
      "assigned",
    );

    // Водитель становится рабочим.
    await setDriverStatus(
      client,
      input.driverId!,
      "on-duty",
    );

    await client.query("COMMIT");

    return createOrderResponse(
      order,
      deliveryAddress,
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }

    throw error;
  } finally {
    client.release();
  }
}

// -----------------------------------------------------------------------------
// UPDATE ORDER
// -----------------------------------------------------------------------------

export async function updateOrder(
  orderId: string,
  input: UpdateOrderInput,
) {
  validateUpdateOrderInput(input);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await findOrderForEdit(
      client,
      orderId,
    );

    if (!order) {
      throw new OrderServiceError(
        "Order not found",
        404,
      );
    }

    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      throw new OrderServiceError(
        "Order cannot be edited in its current status",
        409,
      );
    }

    const clientRecord = await findClientById(
      client,
      input.clientId!,
    );

    if (!clientRecord) {
      throw new OrderServiceError(
        "Client not found",
        404,
      );
    }

    await updateDeliveryAddress(
      client,
      order.deliveryAddressId,
      input.address!,
      input.latitude!,
      input.longitude!,
    );

    const updatedOrder =
      await updateOrderRepository(
        client,
        orderId,
        input.clientId!,
        input.eta!,
      );

    if (!updatedOrder) {
      throw new OrderServiceError(
        "Order not found",
        404,
      );
    }

    await client.query("COMMIT");

    return createOrderResponse(
      updatedOrder,
      {
        id: updatedOrder.deliveryAddressId,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }

    throw error;
  } finally {
    client.release();
  }
}

// -----------------------------------------------------------------------------
// UPDATE ORDER STATUS
// -----------------------------------------------------------------------------


export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
) {
  if (!validateOrderStatus(input.status)) {
    throw new OrderServiceError(
      "Invalid order status",
      400,
    );
  }

  const status = input.status;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await findOrderForUpdate(
      client,
      orderId,
    );

    if (!order) {
      throw new OrderServiceError(
        "Order not found",
        404,
      );
    }

    const currentStatus = order.status as OrderStatus;
    const allowedTransitions =
      allowedOrderTransitions[currentStatus];

    if (!allowedTransitions.includes(status)) {
      throw new OrderServiceError(
        `Cannot change order status from "${currentStatus}" to "${status}"`,
        409,
      );
    }

    let estimatedArrivalAt: Date | undefined;

    // ---------------------------------------------------------
    // START DELIVERY
    // ---------------------------------------------------------

    if (status === "in-progress") {
      const route = input.route;

      if (
        !route?.start ||
        !route?.finish ||
        !route?.path ||
        route.path.length < 2
      ) {
        throw new OrderServiceError(
          "Route is required to start delivery",
          400,
        );
      }

      const activeRoute = await findActiveDeliveryRoute(
        client,
        order.id,
      );

      if (activeRoute) {
        throw new OrderServiceError(
          "Order already has an active delivery route",
          409,
        );
      }

      // Проверяем координаты маршрута.
      const isValidPath = route.path.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1]) &&
          Math.abs(point[0]) <= 180 &&
          Math.abs(point[1]) <= 90,
      );

      if (!isValidPath) {
        throw new OrderServiceError(
          "Route contains invalid coordinates",
          400,
        );
      }

      const path = route.path as Coordinate[];
      const startedAt = new Date();

      // ETA рассчитывается по расстоянию и средней скорости.
      const travelTimeMs = remainingTravelMs(path, 0);

      estimatedArrivalAt = new Date(
        startedAt.getTime() + travelTimeMs,
      );

      await createDeliveryRoute(client, {
        orderId: order.id,
        vehicleId: order.vehicleId,
        driverId: order.driverId,
        startLat: route.start[1],
        startLng: route.start[0],
        finishLat: route.finish[1],
        finishLng: route.finish[0],
        path,
      });

      await createActivity(client, {
        type: "delivery_started",
        title: "Delivery started",
        description: `Order ${order.id} started delivery`,
        orderId: order.id,
        vehicleId: order.vehicleId,
      });

      await createNotification(
        client,
        `Delivery started: order ${order.id}`,
      );

      await setVehicleStatus(
        client,
        order.vehicleId,
        "on-route",
        route.start[1],
        route.start[0],
      );

      const vehicle = await lockVehicle(
        client,
        order.vehicleId,
      );

      if (!vehicle || vehicle.status !== "on-route") {
        throw new OrderServiceError(
          "Vehicle is no longer available",
          409,
        );
      }
    }

    // ---------------------------------------------------------
    // UPDATE ORDER STATUS AND TIMESTAMPS
    // ---------------------------------------------------------

    await updateOrderStatusRepository(
      client,
      order.id,
      status,
      estimatedArrivalAt,
    );

    // ---------------------------------------------------------
    // COMPLETE DELIVERY
    // ---------------------------------------------------------

    if (status === "completed") {
      const activeRoute = await findActiveDeliveryRoute(
        client,
        order.id,
      );

      if (activeRoute) {
        const route =
          await findLatestDeliveryRouteForUpdate(
            client,
            order.id,
          );

        if (route && route.id === activeRoute.id) {
          await completeDeliveryRoute(
            client,
            route.id,
            Number(route.currentPathIndex) || 0,
            route.completedPath ?? [],
            new Date(),
          );
        }
      }

      await setVehicleStatus(
        client,
        order.vehicleId,
        "idle",
      );

      await setDriverStatus(
        client,
        order.driverId,
        "available",
      );

      await createActivity(client, {
        type: "delivery_completed",
        title: "Delivery completed",
        description: `Order ${order.id} completed delivery`,
        orderId: order.id,
        vehicleId: order.vehicleId,
      });

      await createNotification(
        client,
        `Delivery completed: order ${order.id}`,
      );
    }

    // ---------------------------------------------------------
    // LOAD UPDATED ORDER DATA
    // ---------------------------------------------------------

    const updatedOrderResult = await client.query(
      `
        SELECT
          delivery_started_at AS "deliveryStartedAt",
          estimated_arrival_at AS "estimatedArrivalAt",
          delivery_completed_at AS "deliveryCompletedAt"
        FROM orders
        WHERE id = $1
      `,
      [order.id],
    );

    const timestamps = updatedOrderResult.rows[0];

    const deliveryAddress = await findDeliveryAddress(
      client,
      order.deliveryAddressId,
    );

    const deliveryRoute = await findLatestDeliveryRoute(
      client,
      order.id,
    );

    await client.query("COMMIT");

    return {
      id: order.id,
      clientId: order.clientId,
      status,
      address: deliveryAddress?.address ?? "—",
      eta: order.eta ?? "—",
      vehicleId: order.vehicleId,
      driverId: order.driverId,

      deliveryStartedAt:
        timestamps?.deliveryStartedAt ?? null,

      estimatedArrivalAt:
        timestamps?.estimatedArrivalAt ?? null,

      deliveryCompletedAt:
        timestamps?.deliveryCompletedAt ?? null,

      deliveryAddress: {
        id: order.deliveryAddressId,
        latitude: deliveryAddress?.latitude ?? null,
        longitude: deliveryAddress?.longitude ?? null,
      },

      deliveryRoute:
        createDeliveryRouteResponse(deliveryRoute),
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Игнорируем ошибку отката транзакции.
    }

    throw error;
  } finally {
    client.release();
  }
}


// -----------------------------------------------------------------------------
// DELIVERY PROGRESS
// -----------------------------------------------------------------------------


export async function advanceOrderProgress(
  orderId: string,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await findOrderForUpdate(
      client,
      orderId,
    );

    if (!order) {
      throw new OrderServiceError("Order not found", 404);
    }

    const route = await findLatestDeliveryRouteForUpdate(
      client,
      order.id,
    );

    if (!route) {
      await client.query("ROLLBACK");

      if (order.status === "completed") {
        return {
          status: "completed",
          completed: true,
          route: null,
        };
      }

      throw new OrderServiceError(
        "Delivery route not found",
        409,
      );
    }

    const path = route.path as Coordinate[];

    const currentPathIndex = Math.max(
      0,
      Number(route.currentPathIndex) || 0,
    );

    const createProgressRoute = (
      pathIndex = currentPathIndex,
      completed = Boolean(route.completedAt) ||
        order.status === "completed",
    ) => {
      const remainingMs = completed
        ? 0
        : remainingTravelMs(path, pathIndex);

      return {
        id: route.id,
        orderId: route.orderId,
        vehicleId: route.vehicleId,
        driverId: route.driverId,
        currentPathIndex: pathIndex,
        startedAt: route.startedAt,
        lastProgressAt: route.lastProgressAt,
        completedAt: route.completedAt,
        etaMinutes: Math.ceil(remainingMs / 60_000),
      };
    };

    if (
      order.status === "completed" ||
      route.completedAt
    ) {
      await client.query("COMMIT");

      return {
        status: "completed",
        completed: true,
        route: createProgressRoute(),
      };
    }

    if (order.status !== "in-progress") {
      throw new OrderServiceError(
        `Order is not in-progress: ${order.status}`,
        409,
      );
    }

    if (
      !Array.isArray(path) ||
      path.length < 2 ||
      !path.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1]),
      )
    ) {
      throw new OrderServiceError(
        "Delivery route has an invalid path",
        500,
      );
    }

    if (
      currentPathIndex >= path.length ||
      currentPathIndex >= path.length - 1
    ) {
      throw new OrderServiceError(
        "Route index is already at the final point but route is not completed",
        409,
      );
    }

    const lastProgressAt = new Date(
      route.lastProgressAt,
    ).getTime();

    const now = Date.now();

    if (!Number.isFinite(lastProgressAt)) {
      throw new OrderServiceError(
        "Invalid route lastProgressAt timestamp",
        500,
      );
    }

    // Сколько времени прошло с последнего сохранённого прогресса.
    const elapsedMs = Math.max(
      0,
      now - lastProgressAt,
    );

    // Считаем, сколько сегментов маршрут мог пройти
    // за прошедшее время.
    let nextPathIndex = currentPathIndex;
    let consumedMs = 0;

    while (nextPathIndex < path.length - 1) {
      const segmentMs = Math.max(
        1,
        segmentTravelMs(
          path[nextPathIndex],
          path[nextPathIndex + 1],
        ),
      );

      if (consumedMs + segmentMs > elapsedMs) {
        break;
      }

      consumedMs += segmentMs;
      nextPathIndex += 1;
    }

    // Времени пока не хватило даже на следующий сегмент.
    if (nextPathIndex === currentPathIndex) {
      await client.query("COMMIT");

      return {
        status: "in-progress",
        completed: false,
        route: createProgressRoute(),
      };
    }

    const nextPoint = path[nextPathIndex];

    const isCompleted =
      nextPathIndex === path.length - 1;

    // Не теряем остаток времени: сохраняем время последнего
    // полностью пройденного сегмента.
    const nextProgressAt = new Date(
      lastProgressAt + consumedMs,
    );

    const completedPath = path.slice(
      0,
      nextPathIndex + 1,
    );


    if (isCompleted) {
      await completeDeliveryRoute(
        client,
        route.id,
        nextPathIndex,
        completedPath,
        nextProgressAt,
      );

      await updateOrderStatusRepository(
        client,
        order.id,
        "completed",
      );

      await setVehicleStatus(
        client,
        order.vehicleId,
        "idle",
        nextPoint[1],
        nextPoint[0],
      );

      await setDriverStatus(
        client,
        order.driverId,
        "available",
      );

      await createActivity(client, {
        type: "delivery_completed",
        title: "Delivery completed",
        description: `Order ${order.id} completed delivery`,
        orderId: order.id,
        vehicleId: order.vehicleId,
      });

      await createNotification(
        client,
        `Delivery completed: order ${order.id}`,
      );
    } else {
      await updateDeliveryRouteProgress(
        client,
        route.id,
        nextPathIndex,
        completedPath,
        nextProgressAt,
      );

      await setVehicleStatus(
        client,
        order.vehicleId,
        "on-route",
        nextPoint[1],
        nextPoint[0],
      );
    }

    const updatedRoute = await findUpdatedDeliveryRoute(
      client,
      route.id,
    );

    const etaMinutes = isCompleted
      ? 0
      : Math.ceil(
          remainingTravelMs(
            path,
            nextPathIndex,
          ) / 60_000,
        );

    await client.query("COMMIT");

    return {
      status: isCompleted
        ? "completed"
        : "in-progress",
      completed: isCompleted,
      route: {
        ...updatedRoute,
        etaMinutes,
      },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors.
    }

    throw error;
  } finally {
    client.release();
  }
}


// -----------------------------------------------------------------------------
// GET DELIVERY ROUTES
// -----------------------------------------------------------------------------

export async function listDeliveryRoutes() {
  const routes = await findDeliveryRoutes(
    pool as unknown as PoolClient,
  );

  return routes.map((route: any) => {
    const path = route.path as Coordinate[];
    const currentPathIndex =
      Math.max(0, Number(route.currentPathIndex) || 0);

    const completed = Boolean(route.completedAt);

    const etaMinutes = completed
      ? 0
      : Array.isArray(path) && path.length >= 2
        ? Math.ceil(
            remainingTravelMs(path, currentPathIndex) / 60_000,
          )
        : null;

    return {
      ...route,
      etaMinutes,
    };
  });
}


export async function listHistoryDeliveryRoutes() {
  return findHistoryDeliveryRoutes(
    pool as unknown as PoolClient,
  );
}
// -----------------------------------------------------------------------------
// ASSIGN VEHICLE
// -----------------------------------------------------------------------------

export async function assignOrderVehicle(
  orderId: string,
  input: AssignVehicleInput,
) {
  if (!input.vehicleId) {
    throw new OrderServiceError(
      "vehicleId is required",
      400,
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order =
      await findOrderForUpdate(
        client,
        orderId,
      );

    if (!order) {
      throw new OrderServiceError(
        "Order not found",
        404,
      );
    }

    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      throw new OrderServiceError(
        "Vehicle cannot be reassigned for this order status",
        409,
      );
    }

    if (order.vehicleId === input.vehicleId) {
      throw new OrderServiceError(
        "This vehicle is already assigned to the order",
        409,
      );
    }

    const vehicle =
      await lockVehicle(
        client,
        input.vehicleId,
      );

    if (!vehicle) {
      throw new OrderServiceError(
        "Vehicle not found",
        404,
      );
    }

    if (vehicle.status !== "idle") {
      throw new OrderServiceError(
        "Vehicle is not available",
        409,
      );
    }

    const activeVehicleOrder =
      await findActiveVehicleOrder(
        client,
        input.vehicleId,
        order.id,
      );

    if (activeVehicleOrder) {
      throw new OrderServiceError(
        "Vehicle is already assigned to an active order",
        409,
      );
    }

    const driver =
      await lockDriver(
        client,
        order.driverId,
      );

    if (!driver) {
      throw new OrderServiceError(
        "Order driver not found",
        409,
      );
    }

    if (
      driver.vehicleId &&
      driver.vehicleId !== input.vehicleId
    ) {
      throw new OrderServiceError(
        "Selected driver is assigned to another vehicle",
        409,
      );
    }

    // Освобождаем старую машину.
    await setVehicleStatus(
      client,
      order.vehicleId,
      "idle",
    );

    // Назначаем новую.
    await setVehicleStatus(
      client,
      input.vehicleId,
      "assigned",
    );

    const updatedOrder =
      await updateOrderVehicle(
        client,
        order.id,
        input.vehicleId,
      );

    if (!updatedOrder) {
      throw new OrderServiceError(
        "Order not found",
        404,
      );
    }

    await createNotification(
  client,
  `Vehicle assigned: ${input.vehicleId} to order ${order.id}`,
);

    const deliveryAddress =
      await findDeliveryAddress(
        client,
        updatedOrder.deliveryAddressId,
      );

    await client.query("COMMIT");

    return createOrderResponse(
      updatedOrder,
      deliveryAddress,
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }

    throw error;
  } finally {
    client.release();
  }
}