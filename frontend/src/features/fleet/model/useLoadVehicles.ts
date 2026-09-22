import { useEffect } from "react";
import { useFleetStore } from "@/shared/store/fleet";
import { fetchStreetRoute } from "@/shared/api/fetchStreetRoute";
import { fetchVehicles } from "@/shared/api/vehicles";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const useLoadVehicles = () => {
  const setVehicles = useFleetStore((s) => s.setVehicles);
  const setVehicleRoutePath = useFleetStore((s) => s.setVehicleRoutePath);
  const setSelectedVehicleId = useFleetStore((s) => s.setSelectedVehicleId);

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const existingVehicles = useFleetStore.getState().vehicles;

        if (existingVehicles.length > 0) {
          return;
        }

        const data = await fetchVehicles();

        if (cancelled) return;

        setVehicles(data);

        const routeRequests = data
          .filter(
            (vehicle) =>
              vehicle.route?.start && vehicle.route?.finish
          )
          .map(async (vehicle) => {
            try {
              const path = await fetchStreetRoute(
                vehicle.route!.start,
                vehicle.route!.finish,
                MAPBOX_TOKEN
              );

              if (!cancelled) {
                setVehicleRoutePath(vehicle.id, path);
              }
            } catch (error) {
              console.error(
                `Failed to load route for vehicle ${vehicle.id}`,
                error
              );
            }
          });

        await Promise.all(routeRequests);

        if (cancelled) return;

        const selectedVehicleId =
          useFleetStore.getState().selectedVehicleId;

        if (!selectedVehicleId && data.length > 0) {
          setSelectedVehicleId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load vehicles", error);
      }
    };

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [setVehicles, setVehicleRoutePath, setSelectedVehicleId]);
};