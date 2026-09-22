export type OrderStatus =
  | "in-progress"
  | "completed"
  | "delayed";

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  address: string;
  eta: string;
  vehicleId: string;
}

export const orders: Order[] = [
  {
    id: "ORD-4001",
    clientId: "client-1",
    status: "completed",
    address: "120 Broadway, NY",
    eta: "12:10",
    vehicleId: "vehicle-101",
  },
  {
    id: "ORD-4002",
    clientId: "client-2",
    status: "delayed",
    address: "5th Avenue, NY",
    eta: "13:05",
    vehicleId: "vehicle-305",
  },
  {
    id: "ORD-4003",
    clientId: "client-3",
    status: "in-progress",
    address: "238 Park Ave, Brooklyn, NY",
    eta: "14:32",
    vehicleId: "vehicle-403",
  },
  {
    id: "ORD-4004",
    clientId: "client-4",
    status: "in-progress",
    address: "Madison Ave, NY",
    eta: "15:20",
    vehicleId: "vehicle-101",
  },
];