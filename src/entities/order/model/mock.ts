import type { Order } from "./types";

export const ordersMock: Order[] = [
  {
    id: "ORD-4001",
    clientName: "Brooklyn Client 1",
    status: "completed",
    address: "120 Broadway, NY",
    eta: "12:10",
    vehicleId: "vehicle-401",
  },
  {
    id: "ORD-4002",
    clientName: "Brooklyn Client 2",
    status: "delayed",
    address: "5th Avenue, NY",
    eta: "13:05",
    vehicleId: "vehicle-402",
  },
  {
    id: "ORD-4003",
    clientName: "Brooklyn Client 3",
    status: "in-progress",
    address: "238 Park Ave, Brooklyn, NY",
    eta: "14:32",
    vehicleId: "vehicle-403",
  },
  {
    id: "ORD-4004",
    clientName: "Brooklyn Client 4",
    status: "in-progress",
    address: "Madison Ave, NY",
    eta: "15:20",
    vehicleId: "vehicle-401",
  },
];