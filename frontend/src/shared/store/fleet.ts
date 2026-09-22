import { create } from "zustand";
import type {
  Vehicle,
  LngLat,
} from "@/entities/vehicle/model/types";

interface FleetStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;

  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicleId: (id: string | null) => void;

  setVehicleRoutePath: (id: string, path: LngLat[]) => void;
  stepVehicleAlongRoute: (id: string) => void;
}

const getDefaultSpeed = (vehicle: Vehicle) => {
  if (vehicle.type === "truck") {
    return 42;
  }

  if (vehicle.type === "van") {
    return 35;
  }

  return 28;
};

export const useFleetStore = create<FleetStore>((set) => ({
  vehicles: [],
  selectedVehicleId: null,

  setVehicles: (vehicles) => set({ vehicles }),

  setSelectedVehicleId: (id) =>
    set({ selectedVehicleId: id }),

  setVehicleRoutePath: (id, path) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => {
        if (vehicle.id !== id || !vehicle.route) {
          return vehicle;
        }

        return {
          ...vehicle,

          telemetry: path[0]
            ? {
                ...vehicle.telemetry,
                lng: path[0][0],
                lat: path[0][1],
                updatedAt: new Date().toISOString(),
              }
            : vehicle.telemetry,

          route: {
            ...vehicle.route,
            path,
            completedPath:
              path.length > 0 ? [path[0]] : [],
            currentPathIndex: 0,
            deliveryCompleted: false,
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

        const currentIndex =
          vehicle.route.currentPathIndex ?? 0;

        const nextIndex = Math.min(
          currentIndex + 1,
          vehicle.route.path.length - 1
        );

        const nextPoint =
          vehicle.route.path[nextIndex];

        const completedPath =
          vehicle.route.path.slice(
            0,
            nextIndex + 1
          );

        const deliveryCompleted =
          nextIndex >=
          vehicle.route.path.length - 1;

        const currentSpeed =
          vehicle.telemetry.speedKmH;

        const speed =
          typeof currentSpeed === "number" &&
          currentSpeed > 0
            ? currentSpeed
            : getDefaultSpeed(vehicle);

        return {
          ...vehicle,

          status: deliveryCompleted
            ? "idle"
            : vehicle.status,

          telemetry: {
            ...vehicle.telemetry,
            lng: nextPoint[0],
            lat: nextPoint[1],
            speedKmH: deliveryCompleted
              ? 0
              : speed,
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