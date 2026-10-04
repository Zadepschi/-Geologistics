import { useEffect } from "react";
import { useFleetStore } from "@/shared/store/fleet";
import { fetchStreetRoute } from "@/shared/api/fetchStreetRoute";
import { fetchVehicles } from "@/shared/api/vehicles";
import { fetchOrders } from "@/shared/api/orders";
import { geocodeAddress } from "@/shared/api/geocodeAddress";

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN;

export const useLoadVehicles = () => {
  const setVehicles = useFleetStore(
    (state) => state.setVehicles
  );

  const setVehicleRoutePath = useFleetStore(
    (state) => state.setVehicleRoutePath
  );

  const setSelectedVehicleId = useFleetStore(
    (state) => state.setSelectedVehicleId
  );

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const [loadedVehicles, orders] =
          await Promise.all([
            fetchVehicles(),
            fetchOrders(),
          ]);

        if (cancelled) {
          return;
        }

        const currentVehicles =
          useFleetStore.getState().vehicles;

        /*
         * Синхронизируем список машин с backend.
         *
         * Новые машины добавляются.
         * Удалённые на backend исчезают из store.
         *
         * Для уже существующих машин сохраняем
         * runtime-состояние:
         * - telemetry
         * - route
         *
         * Это важно для live tracking.
         */
        const mergedVehicles =
          loadedVehicles.map(
            (loadedVehicle) => {
              const currentVehicle =
                currentVehicles.find(
                  (vehicle) =>
                    vehicle.id ===
                    loadedVehicle.id
                );

              if (!currentVehicle) {
                return loadedVehicle;
              }

              return {
                ...loadedVehicle,
                telemetry:
                  currentVehicle.telemetry,
                route:
                  currentVehicle.route,
              };
            }
          );

        setVehicles(mergedVehicles);

        const vehicles =
          useFleetStore.getState().vehicles;

        const routeRequests = vehicles
          .filter(
            (vehicle) =>
              typeof vehicle.telemetry.lat ===
                "number" &&
              typeof vehicle.telemetry.lng ===
                "number" &&
              !vehicle.route?.path?.length
          )
          .map(async (vehicle) => {
            try {
              const vehicleOrders =
                orders.filter(
                  (order) =>
                    order.vehicleId ===
                    vehicle.id
                );

              const activeOrder =
                vehicleOrders.find(
                  (order) =>
                    order.status ===
                    "assigned"
                ) ??
                vehicleOrders.find(
                  (order) =>
                    order.status ===
                    "in-progress"
                ) ??
                vehicleOrders.find(
                  (order) =>
                    order.status ===
                    "delayed"
                );

              if (!activeOrder) {
                return;
              }

              const destination =
                await geocodeAddress(
                  activeOrder.address
                );

              if (cancelled) {
                return;
              }

              /*
               * Проверяем store ещё раз после
               * асинхронного geocoding.
               *
               * Возможно, за это время машина
               * уже получила маршрут другим
               * способом.
               */
              const currentVehicle =
                useFleetStore
                  .getState()
                  .vehicles.find(
                    (item) =>
                      item.id === vehicle.id
                  );

              if (
                currentVehicle?.route?.path
                  ?.length
              ) {
                return;
              }

              const start: [number, number] = [
                vehicle.telemetry.lng,
                vehicle.telemetry.lat,
              ];

              const finish: [number, number] = [
                destination.longitude,
                destination.latitude,
              ];

              const path =
                await fetchStreetRoute(
                  start,
                  finish,
                  MAPBOX_TOKEN
                );

              if (
                cancelled ||
                path.length < 2
              ) {
                return;
              }

              /*
               * Последняя проверка перед записью.
               *
               * Если маршрут уже появился,
               * не сбрасываем его
               * currentPathIndex.
               */
              const latestVehicle =
                useFleetStore
                  .getState()
                  .vehicles.find(
                    (item) =>
                      item.id === vehicle.id
                  );

              if (
                latestVehicle?.route?.path
                  ?.length
              ) {
                return;
              }

              setVehicleRoutePath(
                vehicle.id,
                path
              );
            } catch (error) {
              console.error(
                `Failed to load route for vehicle ${vehicle.id}`,
                error
              );
            }
          });

        await Promise.all(
          routeRequests
        );

        if (cancelled) {
          return;
        }

        const selectedVehicleId =
          useFleetStore.getState()
            .selectedVehicleId;

        if (
          !selectedVehicleId &&
          vehicles.length > 0
        ) {
          setSelectedVehicleId(
            vehicles[0].id
          );
        }
      } catch (error) {
        console.error(
          "Failed to load vehicles",
          error
        );
      }
    };

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [
    setVehicles,
    setVehicleRoutePath,
    setSelectedVehicleId,
  ]);
};