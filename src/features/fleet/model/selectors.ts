import { useMemo } from "react";
import { useFleetStore } from "@/shared/store/fleet";

export const useFilteredVehicles = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const vehicleFilter = useFleetStore((s) => s.vehicleFilter);

  return useMemo(() => {
    if (vehicleFilter === "all") return vehicles;
    return vehicles.filter((v) => v.status === vehicleFilter);
  }, [vehicles, vehicleFilter]);
};

export const useSelectedVehicle = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore((s) => s.selectedVehicleId);

  return useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId]
  );
};