import { useEffect, useState } from "react";

import { Card } from "@/shared/ui/card/Card";
import { Badge } from "@/shared/ui/badge/Badge";
import { Progress } from "@/shared/ui/progress/Progress";
import { useFleetStore } from "@/shared/store/fleet";
import { fetchDrivers } from "@/shared/api/drivers";
import type { Driver } from "@/entities/driver";
import type { Vehicle } from "@/entities/vehicle/model/types";

import styles from "./OrderDetailsWidget.module.scss";

const formatVehicleTitle = (vehicle: Vehicle) => {
  const type =
    vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1);

  return `${type} #${vehicle.id.replace("vehicle-", "")}`;
};

const getVehicleStatus = (vehicle: Vehicle) => vehicle.status;



const getDriverName = (
  vehicle: Vehicle,
  drivers: Driver[]
) => {
  const driver = drivers.find(
    (item) => item.vehicleId === vehicle.id
  );

  return driver?.name ?? "Not assigned";
};

const getCurrentSpeed = (vehicle: Vehicle) => {
  if (vehicle.status === "idle") {
    return "0 km/h";
  }

  const speed = vehicle.telemetry.speedKmH;

  return typeof speed === "number"
    ? `${Math.round(speed)} km/h`
    : "—";
};

const getEta = (vehicle: Vehicle) => {
  if (
    vehicle.status === "idle" ||
    vehicle.route?.deliveryCompleted
  ) {
    return "Completed";
  }

  const eta = vehicle.route?.etaMinutes;

  if (typeof eta !== "number") {
    return "—";
  }

  const hours = Math.floor(eta / 60);
  const minutes = eta % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

const getProgressValue = (vehicle: Vehicle) => {
  const total = vehicle.route?.path.length ?? 0;
  const completed = vehicle.route?.completedPath?.length ?? 0;

  if (total < 2 || completed < 2) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((completed / total) * 100)
  );
};

export const OrderDetailsWidget = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore(
    (s) => s.selectedVehicleId
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDrivers = async () => {
      try {
        const data = await fetchDrivers();

        if (!cancelled) {
          setDrivers(data);
        }
      } catch (error) {
        console.error("Failed to load drivers:", error);
      }
    };

    loadDrivers();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) ??
    vehicles[0] ??
    null;

  if (!selectedVehicle) {
    return (
      <Card className={styles.widget}>
        <div className={styles.empty}>
          Select a vehicle to view delivery details
        </div>
      </Card>
    );
  }

  const progress = getProgressValue(selectedVehicle);

  return (
    <Card className={styles.widget}>
      <div className={styles.vehicle}>
        <Badge tone="green">
          {getVehicleStatus(selectedVehicle)}
        </Badge>

        <strong className={styles.title}>
          {formatVehicleTitle(selectedVehicle)}
        </strong>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span>Speed</span>
        <strong>{getCurrentSpeed(selectedVehicle)}</strong>
      </div>

      <div className={styles.stat}>
        <span>Driver</span>
        <strong>
          {getDriverName(selectedVehicle, drivers)}
        </strong>
      </div>

      <div className={styles.stat}>
        <span>ETA</span>
        <strong>{getEta(selectedVehicle)}</strong>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressHeader}>
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>

        <Progress value={progress} />
      </div>
    </Card>
  );
};