export type OrderStatus =
  | "assigned"
  | "in-progress"
  | "completed"
  | "delayed";

export interface OrderDeliveryRoute {
  id: number;
  orderId: string;
  vehicleId: string;
  driverId: string;
  start: [number, number];
  finish: [number, number];
  path: [number, number][];
  currentPathIndex: number;
  completedPath: [number, number][];
  startedAt: string;
  lastProgressAt: string;
  completedAt: string | null;
}

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  address: string;
  eta: string;
  vehicleId: string;
  driverId?: string;
  deliveryRoute?: OrderDeliveryRoute | null;
}