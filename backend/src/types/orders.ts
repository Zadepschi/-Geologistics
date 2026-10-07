export type OrderStatus =
  | "assigned"
  | "in-progress"
  | "completed"
  | "delayed";

export const allowedOrderTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  assigned: ["in-progress", "delayed"],
  "in-progress": ["completed", "delayed"],
  delayed: ["in-progress"],
  completed: [],
};

export type LngLat = [number, number];

export interface DeliveryRouteState {
  id: number;

  orderId: string;
  vehicleId: string;
  driverId: string;

  start: LngLat;
  finish: LngLat;

  /**
   * Полный маршрут от начала до конца.
   * Источник истины — PostgreSQL delivery_routes.path.
   */
  path: LngLat[];

  /**
   * Индекс текущей точки в path.
   * Источник истины — PostgreSQL delivery_routes.current_path_index.
   */
  currentPathIndex: number;

  /**
   * Уже пройденная часть маршрута.
   * Источник истины — PostgreSQL delivery_routes.completed_path.
   */
  completedPath: LngLat[];

  /**
   * Время начала маршрута.
   */
  startedAt: string;

  /**
   * Время последнего сохранённого прогресса.
   */
  lastProgressAt: string;

  /**
   * NULL, пока доставка не завершена.
   */
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

  /**
   * Состояние текущего/последнего маршрута доставки.
   *
   * Прогресс маршрута хранится на backend в PostgreSQL,
   * а не только в памяти frontend.
   */
  deliveryRoute?: DeliveryRouteState | null;
}