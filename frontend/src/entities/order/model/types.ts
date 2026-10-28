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

  city?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  eta: string;
  vehicleId: string;
  driverId?: string;
  deliveryRoute?: OrderDeliveryRoute | null;

  deliveryStartedAt?: string | null;
  estimatedArrivalAt?: string | null;
  deliveryCompletedAt?: string | null;
}
