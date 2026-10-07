import type {
  Order,
  OrderStatus,
} from "@/entities/order";

export async function fetchOrders(): Promise<
  Order[]
> {
  const res = await fetch("/api/orders");

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  return res.json();
}

export interface DeliveryRoute {
  id: number;
  orderId: string;
  vehicleId: string;
  driverId: string;

  startLat: number;
  startLng: number;

  finishLat: number;
  finishLng: number;

  path: [number, number][];

  currentPathIndex: number;
  completedPath: [number, number][];

  startedAt: string;
  lastProgressAt: string;
  completedAt: string | null;
}

export async function fetchDeliveryRoutes(): Promise<
  DeliveryRoute[]
> {
  const res = await fetch(
    "/api/delivery-routes"
  );

  if (!res.ok) {
    throw new Error(
      "Failed to fetch delivery routes"
    );
  }

  return res.json();
}

// ------------------------------------------------------------
// Продвигаем доставку через backend.
//
// ВАЖНО:
// frontend НЕ передаёт currentPathIndex.
//
// Backend сам читает:
// - current_path_index
// - last_progress_at
//
// из PostgreSQL и вычисляет новую позицию.
// ------------------------------------------------------------

export interface DeliveryProgressResponse {
  status:
    | "in-progress"
    | "completed";

  completed: boolean;

  route: DeliveryRoute;
}

export async function advanceOrderProgress(
  orderId: string
): Promise<DeliveryProgressResponse> {
  const res = await fetch(
    `/api/orders/${orderId}/progress`,
    {
      method: "PATCH",
    }
  );

  if (!res.ok) {
    const data =
      await res.json().catch(() => null);

    throw new Error(
      data?.message ??
        `Failed to advance delivery progress: ${res.status}`
    );
  }

  return res.json();
}

export interface OrderRoutePayload {
  start: [number, number];
  finish: [number, number];
  path: [number, number][];
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  route?: OrderRoutePayload
): Promise<Order> {
  const res = await fetch(
    `/api/orders/${id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        route,
      }),
    }
  );

  if (!res.ok) {
    const data =
      await res.json().catch(() => null);

    throw new Error(
      data?.message ??
        `Failed to update order status: ${res.status}`
    );
  }

  return res.json();
}

export async function updateOrderVehicle(
  id: string,
  vehicleId: string
): Promise<Order> {
  const res = await fetch(
    `/api/orders/${id}/vehicle`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vehicleId,
      }),
    }
  );

  if (!res.ok) {
    const data =
      await res.json().catch(() => null);

    throw new Error(
      data?.message ??
        `Failed to assign vehicle: ${res.status}`
    );
  }

  return res.json();
}

export interface UpdateOrderPayload {
  clientId: string;
  address: string;
  latitude: number;
  longitude: number;
  eta: string;
}

export async function updateOrder(
  id: string,
  payload: UpdateOrderPayload
): Promise<Order> {
  const res = await fetch(
    `/api/orders/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const data =
      await res.json().catch(() => null);

    throw new Error(
      data?.message ??
        `Failed to update order: ${res.status}`
    );
  }

  return res.json();
}

export async function deleteOrder(
  id: string
): Promise<void> {
  const res = await fetch(
    `/api/orders/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    const data =
      await res.json().catch(() => null);

    throw new Error(
      data?.message ??
        `Failed to delete order: ${res.status}`
    );
  }
}

export interface CreateOrderPayload {
  clientId: string;
  address: string;
  latitude: number;
  longitude: number;
  vehicleId: string;
  driverId: string;
  eta: string;
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<Order> {
  const res = await fetch(
    "/api/orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const data =
      await res.json().catch(() => null);

    throw new Error(
      data?.message ??
        `Failed to create order: ${res.status}`
    );
  }

  return res.json();
}