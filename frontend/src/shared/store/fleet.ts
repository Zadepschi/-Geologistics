import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Vehicle,
  LngLat,
} from "@/entities/vehicle/model/types";

interface VehicleRouteState {
  orderId: string;
  start: LngLat;
  finish: LngLat;
  path: LngLat[];
  completedPath: LngLat[];
  currentPathIndex: number;
  deliveryCompleted: boolean;
  etaMinutes: number;
}

interface FleetStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;

  setVehicles: (vehicles: Vehicle[]) => void;

  setSelectedVehicleId: (
    id: string | null
  ) => void;

  setVehicleRouteState: (
    id: string,
    route: VehicleRouteState
  ) => void;

  clearVehicleRoute: (
    id: string
  ) => void;
}

export const useFleetStore =
  create<FleetStore>()(
    persist(
      (set) => ({
        vehicles: [],
        selectedVehicleId: null,

        setVehicles: (vehicles) =>
          set({
            vehicles,
          }),

        setSelectedVehicleId: (id) =>
          set({
            selectedVehicleId: id,
          }),

        setVehicleRouteState: (
          id,
          route
        ) =>
          set((state) => ({
            vehicles: state.vehicles.map(
              (vehicle) => {
                if (vehicle.id !== id) {
                  return vehicle;
                }

                const currentIndex =
                  Math.max(
                    0,
                    Math.min(
                      route.currentPathIndex,
                      route.path.length - 1
                    )
                  );

                const currentPoint =
                  route.path[currentIndex] ??
                  route.start;

                return {
                  ...vehicle,

                  status:
                    route.deliveryCompleted
                      ? "idle"
                      : "on-route",

                  telemetry: {
                    ...vehicle.telemetry,

                    lng: currentPoint[0],
                    lat: currentPoint[1],

                    speedKmH:
                      route.deliveryCompleted
                        ? 0
                        : vehicle.telemetry.speedKmH,

                    updatedAt:
                      new Date().toISOString(),
                  },

                  route: {
                    orderId: route.orderId,

                    start: route.start,
                    finish: route.finish,
                    path: route.path,

                    completedPath:
                      route.completedPath,

                    currentPathIndex:
                      currentIndex,

                    deliveryCompleted:
                      route.deliveryCompleted,

                    etaMinutes:
                      route.etaMinutes,
                  },
                };
              }
            ),
          })),

        clearVehicleRoute: (id) =>
          set((state) => ({
            vehicles: state.vehicles.map(
              (vehicle) => {
                if (vehicle.id !== id) {
                  return vehicle;
                }

                return {
                  ...vehicle,
                  route: undefined,
                };
              }
            ),
          })),
      }),

      {
        name: "geologistics-fleet",

        partialize: (state) => ({
          selectedVehicleId:
            state.selectedVehicleId,
        }),
      }
    )
  );