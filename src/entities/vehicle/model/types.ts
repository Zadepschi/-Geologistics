export type VehicleStatus = "on-route" | "idle" | "maintenance" | "delayed";
export type VehicleType = "truck" | "van" | "bike";
export type LngLat = [number, number]; // [lng, lat]

export interface VehicleRoute {
  start: LngLat;
  finish: LngLat;
  path: LngLat[];
  completedPath?: LngLat[];
  etaMinutes?: number;
  stopsLeft?: number;
  deliveryCompleted?: boolean;
  currentPathIndex?: number;
}

export interface Vehicle {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  driverName?: string;

  telemetry: {
    lat: number;
    lng: number;
    speedKmH?: number;
    heading?: number;
    updatedAt?: string;
  };

  route?: VehicleRoute;
}