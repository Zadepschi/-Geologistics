export type OrderStatus = "in-progress" | "completed" | "delayed";

export interface Order {
  id: string;
  clientName: string;
  status: OrderStatus;
  address: string;
  eta: string; // можно потом заменить на Date
  vehicleId: string;
}