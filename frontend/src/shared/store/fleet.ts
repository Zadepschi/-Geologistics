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

  setVehicleRoutePath: (
    id: string,
    path: LngLat[]
  ) => void;

  stepVehicleAlongRoute: (
    id: string
  ) => void;
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

export const useFleetStore = create<FleetStore>(
  (set) => ({
    vehicles: [],
    selectedVehicleId: null,

    setVehicles: (vehicles) =>
      set({ vehicles }),

    setSelectedVehicleId: (id) =>
      set({
        selectedVehicleId: id,
      }),

    setVehicleRoutePath: (id, path) =>
      set((state) => ({
        vehicles: state.vehicles.map(
          (vehicle) => {
            if (
              vehicle.id !== id ||
              path.length === 0
            ) {
              return vehicle;
            }

            const start = path[0];

            const finish =
              path[path.length - 1];

            return {
              ...vehicle,

              telemetry: {
                ...vehicle.telemetry,
                lng: start[0],
                lat: start[1],
                updatedAt:
                  new Date().toISOString(),
              },

              route: {
                start,
                finish,
                path,
                completedPath: [start],
                currentPathIndex: 0,
                deliveryCompleted: false,
              },
            };
          }
        ),
      })),

    stepVehicleAlongRoute: (id) =>
      set((state) => ({
        vehicles: state.vehicles.map(
          (vehicle) => {
            if (
              vehicle.id !== id ||
              vehicle.status !== "on-route" ||
              !vehicle.route?.path?.length
            ) {
              return vehicle;
            }

            const currentIndex =
              vehicle.route
                .currentPathIndex ?? 0;

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
                speedKmH:
                  deliveryCompleted
                    ? 0
                    : speed,
                updatedAt:
                  new Date().toISOString(),
              },

              route: {
                ...vehicle.route,
                currentPathIndex:
                  nextIndex,
                completedPath,
                deliveryCompleted,
              },
            };
          }
        ),
      })),
  })
);