import type { VehicleStatus } from "@/entities/vehicle/model/types";

export interface VehicleFilterState {
  status: VehicleStatus | "all";
  search: string;
}