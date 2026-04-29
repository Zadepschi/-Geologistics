import type { RoutePoint } from "./types";

export const routePointsMock: RoutePoint[] = [
  { id: "r1", x: 16, y: 42, type: "vehicle", label: "Truck" },
  { id: "r2", x: 24, y: 46, type: "stop" },
  { id: "r3", x: 44, y: 38, type: "vehicle", label: "Van" },
  { id: "r4", x: 62, y: 50, type: "cluster", label: "3" },
  { id: "r5", x: 66, y: 56, type: "stop" },
  { id: "r6", x: 72, y: 66, type: "vehicle", label: "Bike #403" },
  { id: "r7", x: 82, y: 78, type: "stop" },
];