export type VehicleStatus =
  | "on-route"
  | "idle"
  | "maintenance"
  | "delayed";

export type VehicleType =
  | "truck"
  | "van"
  | "bike";

export type LngLat = [number, number];

export interface VehicleRoute {
  start: LngLat;
  finish: LngLat;
  path: LngLat[];
  completedPath?: LngLat[];
  etaMinutes?: number;
  deliveryCompleted?: boolean;
  currentPathIndex?: number;
}

export interface Vehicle {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  telemetry: {
    lat: number;
    lng: number;
    speedKmH?: number;
    heading?: number;
    updatedAt?: string;
  };
  route?: VehicleRoute;
}

export const vehicles: Vehicle[] = [
  {
    id: "vehicle-101",
    code: "101",
    name: "Truck #101",
    type: "truck",
    status: "on-route",
    telemetry: {
      lat: 40.706,
      lng: -74.012,
      speedKmH: 42,
      heading: 85,
      updatedAt: new Date().toISOString(),
    },
    route: {
      start: [-74.012, 40.706],
      finish: [-73.9955, 40.7221],
      path: [
        [-74.012, 40.706],
        [-74.01, 40.708],
        [-74.008, 40.7105],
        [-74.006, 40.7128],
        [-74.003, 40.716],
        [-73.999, 40.719],
        [-73.9955, 40.7221],
      ],
      completedPath: [],
      etaMinutes: 12,
      deliveryCompleted: false,
      currentPathIndex: 0,
    },
  },
  {
    id: "vehicle-305",
    code: "305",
    name: "Van #305",
    type: "van",
    status: "idle",
    telemetry: {
      lat: 40.728,
      lng: -73.944,
      speedKmH: 0,
      heading: 0,
      updatedAt: new Date().toISOString(),
    },
    route: {
      start: [-73.944, 40.728],
      finish: [-73.921, 40.742],
      path: [
        [-73.944, 40.728],
        [-73.94, 40.73],
        [-73.936, 40.733],
        [-73.932, 40.736],
        [-73.927, 40.739],
        [-73.921, 40.742],
      ],
      completedPath: [],
      etaMinutes: 0,
      deliveryCompleted: false,
      currentPathIndex: 0,
    },
  },
  {
    id: "vehicle-403",
    code: "403",
    name: "Bike #403",
    type: "bike",
    status: "on-route",
    telemetry: {
      lat: 40.735,
      lng: -73.998,
      speedKmH: 28,
      heading: 140,
      updatedAt: new Date().toISOString(),
    },
    route: {
      start: [-73.998, 40.735],
      finish: [-73.9772, 40.7612],
      path: [
        [-73.998, 40.735],
        [-73.994, 40.739],
        [-73.99, 40.744],
        [-73.986, 40.749],
        [-73.982, 40.755],
        [-73.9772, 40.7612],
      ],
      completedPath: [],
      etaMinutes: 14,
      deliveryCompleted: false,
      currentPathIndex: 0,
    },
  },
];