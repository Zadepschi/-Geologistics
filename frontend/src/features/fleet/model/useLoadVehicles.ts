import { useEffect } from "react";
import { useFleetStore } from "@/shared/store/fleet";
import { fetchStreetRoute } from "@/shared/api/fetchStreetRoute";
import { fetchVehicles } from "@/shared/api/vehicles";
import { fetchOrders } from "@/shared/api/orders";
import { geocodeAddress } from "@/shared/api/geocodeAddress";

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN;

const STEP_INTERVAL = 1000;

export const useLoadVehicles = () => {
  const setVehicles = useFleetStore(
    (s) => s.setVehicles
  );

  const setVehicleRoutePath = useFleetStore(
    (s) => s.setVehicleRoutePath
  );

  const setSelectedVehicleId = useFleetStore(
    (s) => s.setSelectedVehicleId
  );

  const stepVehicleAlongRoute = useFleetStore(
    (s) => s.stepVehicleAlongRoute
  );

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const existingVehicles =
          useFleetStore.getState().vehicles;

        if (existingVehicles.length > 0) {
          return;
        }

        const [vehicles, orders] =
          await Promise.all([
            fetchVehicles(),
            fetchOrders(),
          ]);

        if (cancelled) {
          return;
        }

        setVehicles(vehicles);

        const routeRequests = vehicles
          .filter(
            (vehicle) =>
              typeof vehicle.telemetry.lat ===
                "number" &&
              typeof vehicle.telemetry.lng ===
                "number"
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

              if (!cancelled) {
                setVehicleRoutePath(
                  vehicle.id,
                  path
                );
              }
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

    const intervalId =
      window.setInterval(() => {
        const currentVehicles =
          useFleetStore.getState().vehicles;

        currentVehicles.forEach(
          (vehicle) => {
            if (
              vehicle.status ===
                "on-route" &&
              vehicle.route?.path?.length
            ) {
              stepVehicleAlongRoute(
                vehicle.id
              );
            }
          }
        );
      }, STEP_INTERVAL);

    return () => {
      cancelled = true;
      window.clearInterval(
        intervalId
      );
    };
  }, [
    setVehicles,
    setVehicleRoutePath,
    setSelectedVehicleId,
    stepVehicleAlongRoute,
  ]);
};