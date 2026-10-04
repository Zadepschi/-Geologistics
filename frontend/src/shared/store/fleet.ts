import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Vehicle,
  LngLat,
} from "@/entities/vehicle/model/types";

interface FleetStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;

  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicleId: (
    id: string | null
  ) => void;

  setVehicleRoutePath: (
    id: string,
    path: LngLat[]
  ) => void;

  stepVehicleAlongRoute: (
    id: string
  ) => void;
}

const getDefaultSpeed = (
  vehicle: Vehicle
) => {
  if (vehicle.type === "truck") {
    return 42;
  }

  if (vehicle.type === "van") {
    return 35;
  }

  return 28;
};

const getDistanceKm = (
  start: LngLat,
  finish: LngLat
) => {
  const earthRadiusKm = 6371;

  const lat1 =
    (start[1] * Math.PI) / 180;
  const lat2 =
    (finish[1] * Math.PI) / 180;

  const deltaLat =
    ((finish[1] - start[1]) * Math.PI) /
    180;

  const deltaLng =
    ((finish[0] - start[0]) * Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};

const getRouteDistanceKm = (
  path: LngLat[],
  startIndex: number
) => {
  let distanceKm = 0;

  for (
    let index = startIndex;
    index < path.length - 1;
    index += 1
  ) {
    distanceKm += getDistanceKm(
      path[index],
      path[index + 1]
    );
  }

  return distanceKm;
};

const getEtaMinutes = (
  vehicle: Vehicle,
  path: LngLat[],
  currentIndex: number
) => {
  if (
    path.length < 2 ||
    currentIndex >= path.length - 1
  ) {
    return 0;
  }

  const distanceKm =
    getRouteDistanceKm(
      path,
      currentIndex
    );

  const currentSpeed =
    vehicle.telemetry.speedKmH;

  const speed =
    typeof currentSpeed === "number" &&
    currentSpeed > 0
      ? currentSpeed
      : getDefaultSpeed(vehicle);

  return Math.max(
    0,
    Math.ceil(
      (distanceKm / speed) * 60
    )
  );
};

export const useFleetStore =
  create<FleetStore>()(
    persist(
      (set) => ({
        vehicles: [],
        selectedVehicleId: null,

        setVehicles: (vehicles) =>
          set({ vehicles }),

        setSelectedVehicleId: (id) =>
          set({
            selectedVehicleId: id,
          }),

        setVehicleRoutePath: (
          id,
          path
        ) =>
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

                const etaMinutes =
                  getEtaMinutes(
                    vehicle,
                    path,
                    0
                  );

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
                    etaMinutes,
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
                  vehicle.status !==
                    "on-route" ||
                  !vehicle.route?.path?.length
                ) {
                  return vehicle;
                }

                const currentIndex =
                  vehicle.route
                    .currentPathIndex ?? 0;

                const lastIndex =
                  vehicle.route.path.length - 1;

                const nextIndex = Math.min(
                  currentIndex + 1,
                  lastIndex
                );

                const nextPoint =
                  vehicle.route.path[
                    nextIndex
                  ];

                const completedPath =
                  vehicle.route.path.slice(
                    0,
                    nextIndex + 1
                  );

                const deliveryCompleted =
                  nextIndex >= lastIndex;

                const currentSpeed =
                  vehicle.telemetry
                    .speedKmH;

                const speed =
                  typeof currentSpeed ===
                    "number" &&
                  currentSpeed > 0
                    ? currentSpeed
                    : getDefaultSpeed(
                        vehicle
                      );

                const etaMinutes =
                  deliveryCompleted
                    ? 0
                    : getEtaMinutes(
                        vehicle,
                        vehicle.route.path,
                        nextIndex
                      );

                return {
                  ...vehicle,

                  status: "on-route",

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
                    etaMinutes,
                  },
                };
              }
            ),
          })),
      }),
      {
        name: "geologistics-fleet",

        partialize: (state) => ({
          vehicles: state.vehicles,
          selectedVehicleId:
            state.selectedVehicleId,
        }),
      }
    )
  );