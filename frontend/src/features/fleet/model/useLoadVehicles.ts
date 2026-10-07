import { useEffect } from "react";

import { useFleetStore } from "@/shared/store/fleet";

import {
  fetchVehicles,
} from "@/shared/api/vehicles";

import {
  fetchDeliveryRoutes,
} from "@/shared/api/orders";

export const useLoadVehicles = () => {
  const setVehicles = useFleetStore(
    (state) => state.setVehicles
  );

  const setVehicleRouteState =
    useFleetStore(
      (state) =>
        state.setVehicleRouteState
    );

  const setSelectedVehicleId =
    useFleetStore(
      (state) =>
        state.setSelectedVehicleId
    );

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const [
          loadedVehicles,
          deliveryRoutes,
        ] = await Promise.all([
          fetchVehicles(),
          fetchDeliveryRoutes(),
        ]);

        if (cancelled) {
          return;
        }

        /*
         * PostgreSQL является источником истины.
         */
        setVehicles(
          loadedVehicles
        );

        /*
         * Восстанавливаем сохранённые
         * маршруты непосредственно из
         * delivery_routes PostgreSQL.
         *
         * /api/orders здесь больше не вызываем.
         */
        for (
          const deliveryRoute of
            deliveryRoutes
        ) {
          if (cancelled) {
            return;
          }

          if (
            !deliveryRoute.vehicleId
          ) {
            continue;
          }

          if (
            !deliveryRoute.path ||
            deliveryRoute.path.length < 2
          ) {
            continue;
          }

          const currentPathIndex =
            Math.max(
              0,
              Math.min(
                deliveryRoute.currentPathIndex ??
                  0,
                deliveryRoute.path.length - 1
              )
            );

          const completedPath =
            deliveryRoute
              .completedPath?.length
              ? deliveryRoute.completedPath
              : deliveryRoute.path.slice(
                  0,
                  currentPathIndex + 1
                );

          const deliveryCompleted =
            Boolean(
              deliveryRoute.completedAt
            );

          /*
           * Пока ETA не вычисляем локально.
           */
          const etaMinutes =
            deliveryCompleted
              ? 0
              : 0;

          setVehicleRouteState(
            deliveryRoute.vehicleId,
            {
              orderId:
                deliveryRoute.orderId,

              start: [
                deliveryRoute.startLng,
                deliveryRoute.startLat,
              ],

              finish: [
                deliveryRoute.finishLng,
                deliveryRoute.finishLat,
              ],

              path:
                deliveryRoute.path,

              completedPath,

              currentPathIndex,

              deliveryCompleted,

              etaMinutes,
            }
          );
        }

        if (cancelled) {
          return;
        }

        const selectedVehicleId =
          useFleetStore.getState()
            .selectedVehicleId;

        const currentVehicles =
          useFleetStore.getState()
            .vehicles;

        if (
          !selectedVehicleId &&
          currentVehicles.length > 0
        ) {
          setSelectedVehicleId(
            currentVehicles[0].id
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load vehicles",
            error
          );
        }
      }
    };

    void loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [
    setVehicles,
    setVehicleRouteState,
    setSelectedVehicleId,
  ]);
};