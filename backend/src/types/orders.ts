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

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  address: string;
  eta: string;
  vehicleId: string;
}