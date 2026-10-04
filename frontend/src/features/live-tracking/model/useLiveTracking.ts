import { useEffect } from "react";
import { useFleetStore } from "@/shared/store/fleet";

const STEP_INTERVAL_MS = 700;

export const useLiveTracking = () => {
  useEffect(() => {
    let lastTickAt = Date.now();

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastTickAt;

      lastTickAt = now;

      const steps = Math.max(
        1,
        Math.floor(
          elapsedMs / STEP_INTERVAL_MS
        )
      );

      const {
        vehicles,
        stepVehicleAlongRoute,
      } = useFleetStore.getState();

      vehicles.forEach((vehicle) => {
        const route = vehicle.route;

        if (
          vehicle.status !== "on-route" ||
          !route?.path ||
          route.path.length <= 1
        ) {
          return;
        }

        const currentPathIndex =
          route.currentPathIndex ?? 0;

        const lastPathIndex =
          route.path.length - 1;

        /*
         * Машина уже физически дошла
         * до последней точки маршрута.
         *
         * Не двигаем её дальше.
         *
         * Важно:
         * deliveryCompleted здесь намеренно
         * не используется.
         *
         * Статус завершения заказа должен
         * определяться заказом, а не этим
         * локальным runtime-флагом маршрута.
         */
        if (
          currentPathIndex >= lastPathIndex
        ) {
          return;
        }

        for (
          let i = 0;
          i < steps;
          i += 1
        ) {
          const currentVehicle =
            useFleetStore
              .getState()
              .vehicles.find(
                (item) =>
                  item.id === vehicle.id
              );

          if (!currentVehicle) {
            break;
          }

          if (
            currentVehicle.status !==
            "on-route"
          ) {
            break;
          }

          const currentRoute =
            currentVehicle.route;

          if (
            !currentRoute?.path ||
            currentRoute.path.length <= 1
          ) {
            break;
          }

          const currentIndex =
            currentRoute.currentPathIndex ??
            0;

          const lastIndex =
            currentRoute.path.length - 1;

          if (currentIndex >= lastIndex) {
            break;
          }

          stepVehicleAlongRoute(
            currentVehicle.id
          );
        }
      });
    }, STEP_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
};