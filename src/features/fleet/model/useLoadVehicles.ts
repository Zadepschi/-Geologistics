import { useEffect } from "react";
import type { Vehicle } from "@/entities/vehicle/model/types";
import { useFleetStore } from "@/shared/store/fleet";
import { fetchStreetRoute } from "@/shared/api/fetchStreetRoute";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const useLoadVehicles = () => {
  const setVehicles = useFleetStore((s) => s.setVehicles);
  const setVehicleRoutePath = useFleetStore((s) => s.setVehicleRoutePath);
  const setSelectedVehicleId = useFleetStore((s) => s.setSelectedVehicleId);

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles");
        const data: Vehicle[] = await res.json();

        if (cancelled) return;

        setVehicles(data);

        // 🔥 ВОТ ГЛАВНОЕ ДОБАВЛЕНИЕ
        for (const vehicle of data) {
          if (!vehicle.route?.start || !vehicle.route?.finish) continue;

          const path = await fetchStreetRoute(
            vehicle.route.start,
            vehicle.route.finish,
            MAPBOX_TOKEN
          );

          if (cancelled) return;

          setVehicleRoutePath(vehicle.id, path);
        }

        if (data.length > 0) {
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