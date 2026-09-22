import { useEffect } from "react";
import { useFleetStore } from "@/shared/store/fleet";

export const useLiveTracking = () => {
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const { vehicles, stepVehicleAlongRoute } = useFleetStore.getState();

      vehicles.forEach((vehicle) => {
        if (
          vehicle.status === "on-route" &&
          vehicle.route?.path &&
          vehicle.route.path.length > 1 &&
          !vehicle.route.deliveryCompleted
        ) {
          stepVehicleAlongRoute(vehicle.id);
        }
      });
    }, 700);

    return () => window.clearInterval(intervalId);
  }, []);
};