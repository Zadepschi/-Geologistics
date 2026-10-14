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


const formatEta = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
};

const getMetaText = (vehicle: Vehicle) => {
  const { route, status } = vehicle;
  const eta = route?.etaMinutes;

  switch (status) {
    case "on-route":
      return eta !== undefined
        ? `On route • ${formatEta(eta)}`
        : "On route";

    case "idle":
      return "Idle • Standby";

    case "maintenance":
      return "Maintenance";

    case "delayed":
      return eta !== undefined
        ? `Delayed • ${formatEta(eta)}`
        : "Delayed";

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