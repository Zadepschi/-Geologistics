export type OrderStatus = "in-progress" | "completed" | "delayed";

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  address: string;
  eta: string;
  vehicleId: string;
}