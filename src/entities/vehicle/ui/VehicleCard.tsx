import type { Vehicle } from "../model/types";
import styles from "./VehicleCard.module.scss";
import { cn } from "@/shared/lib/cn";
import { Wrench, Clock3 } from "lucide-react";
import { VehicleTypeIcon } from "./VehicleTypeIcon";

interface VehicleCardProps {
  vehicle: Vehicle;
  active?: boolean;
  onClick?: () => void;
}

const getMetaText = (vehicle: Vehicle) => {
  const { route, status } = vehicle;

  switch (status) {
    case "on-route":
      if (route?.stopsLeft !== undefined && route.stopsLeft > 0) {
        return `On route • ${route.stopsLeft} stops left`;
      }

      if (route?.etaMinutes !== undefined) {
        return `On route • ${route.etaMinutes} min`;
      }

      return "On route";

    case "idle":
      return "Idle • Standby";

    case "maintenance":
      return "Maintenance";

    case "delayed":
      return route?.etaMinutes ? `Delayed • ${route.etaMinutes} min` : "Delayed";

    default:
      return status;
  }
};

export const VehicleCard = ({
  vehicle,
  active = false,
  onClick,
}: VehicleCardProps) => {
  const isMaintenance = vehicle.status === "maintenance";
  const isDelayed = vehicle.status === "delayed";

  return (
    <button
      type="button"
      className={cn(styles.card, active && styles.active)}
      onClick={onClick}
    >
      <div
        className={cn(
          styles.iconBox,
          vehicle.type === "truck" && styles.truck,
          vehicle.type === "van" && styles.van,
          vehicle.type === "bike" && styles.bike,
          isMaintenance && styles.maintenanceIcon,
          isDelayed && styles.delayedIcon
        )}
      >
        {isMaintenance ? (
          <Wrench size={18} />
        ) : isDelayed ? (
          <Clock3 size={18} />
        ) : (
          <VehicleTypeIcon type={vehicle.type} size={18} />
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.title}>
          {vehicle.name}
        </div>

        <div className={styles.meta}>
          <span
            className={cn(
              styles.dot,
              vehicle.status === "idle" && styles.dotIdle,
              vehicle.status === "maintenance" && styles.dotMaintenance,
              vehicle.status === "delayed" && styles.dotDelayed
            )}
          />
          <span>{getMetaText(vehicle)}</span>
        </div>
      </div>
    </button>
  );
};