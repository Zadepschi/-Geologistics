export interface RoutePoint {
  id: string;
  x: number;
  y: number;
  type: "vehicle" | "stop" | "cluster";
  label?: string;
}