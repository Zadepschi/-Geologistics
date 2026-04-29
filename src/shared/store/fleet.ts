import { create } from "zustand";
import type {
  Vehicle,
  VehicleStatus,
  VehicleRoute,
  LngLat,
} from "@/entities/vehicle/model/types";

type VehicleFilter = VehicleStatus | "all";

interface FleetStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  vehicleFilter: VehicleFilter;

  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setVehicleFilter: (filter: VehicleFilter) => void;

  updateVehicleTelemetry: (
    id: string,
    telemetry: Partial<Vehicle["telemetry"]>
  ) => void;

  updateVehicleRoute: (id: string, route: Partial<VehicleRoute>) => void;

  setVehicleRoutePath: (id: string, path: LngLat[]) => void;
  stepVehicleAlongRoute: (id: string) => void;
}

export const useFleetStore = create<FleetStore>((set) => ({
  vehicles: [],
  selectedVehicleId: null,
  vehicleFilter: "all",

  setVehicles: (vehicles) => set({ vehicles }),

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  setVehicleFilter: (filter) => set({ vehicleFilter: filter }),

  updateVehicleTelemetry: (id, telemetry) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              telemetry: {
                ...vehicle.telemetry,
                ...telemetry,
                updatedAt: new Date().toISOString(),
              },
            }
          : vehicle
      ),
    })),

  updateVehicleRoute: (id, route) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              route: {
                ...vehicle.route,
                ...route,
              } as VehicleRoute,
            }
          : vehicle
      ),
    })),

  setVehicleRoutePath: (id, path) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => {
        if (vehicle.id !== id || !vehicle.route) return vehicle;

        const firstPoint = path[0];

        return {
          ...vehicle,
          telemetry: firstPoint
            ? {
                ...vehicle.telemetry,
                lng: firstPoint[0],
                lat: firstPoint[1],
                updatedAt: new Date().toISOString(),
              }
            : vehicle.telemetry,
          route: {
            ...vehicle.route,
            path,
            completedPath: path.length > 0 ? [path[0]] : [],
            currentPathIndex: 0,
          },
        };
      }),
    })),

  stepVehicleAlongRoute: (id) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => {
        if (
          vehicle.id !== id ||
          vehicle.status !== "on-route" ||
          !vehicle.route?.path?.length
        ) {
          return vehicle;
        }

        const currentIndex = vehicle.route.currentPathIndex ?? 0;
        const nextIndex = Math.min(
          currentIndex + 1,
          vehicle.route.path.length - 1
        );

        const nextPoint = vehicle.route.path[nextIndex];
        const completedPath = vehicle.route.path.slice(0, nextIndex + 1);
        const deliveryCompleted = nextIndex >= vehicle.route.path.length - 1;

        return {
          ...vehicle,
          status: deliveryCompleted ? "idle" : vehicle.status,
          telemetry: {
            ...vehicle.telemetry,
            lng: nextPoint[0],
            lat: nextPoint[1],
            updatedAt: new Date().toISOString(),
          },
          route: {
            ...vehicle.route,
            currentPathIndex: nextIndex,
            completedPath,
            deliveryCompleted,
          },
        };
      }),
    })),
}));