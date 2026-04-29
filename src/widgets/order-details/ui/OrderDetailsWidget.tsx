import { Card } from "@/shared/ui/card/Card";
import { Badge } from "@/shared/ui/badge/Badge";
import { Progress } from "@/shared/ui/progress/Progress";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./OrderDetailsWidget.module.scss";
import type { Vehicle } from "@/entities/vehicle/model/types";

const formatVehicleTitle = (vehicle: Vehicle) => {
  const type = vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1);
  return `${type} #${vehicle.id}`;
};

const getVehicleStatus = (vehicle: Vehicle) => {
  return "status" in vehicle && typeof vehicle.status === "string"
    ? vehicle.status
    : "On Route";
};

const getDriverName = (vehicle: Vehicle) => {
  return "driver" in vehicle && typeof vehicle.driver === "string"
    ? vehicle.driver
    : "Not assigned";
};

const getCurrentSpeed = (vehicle: Vehicle) => {
  const speed =
    "speed" in vehicle.telemetry && typeof vehicle.telemetry.speed === "number"
      ? vehicle.telemetry.speed
      : null;

  return speed === null ? "—" : `${Math.round(speed)} km/h`;
};

const getProgressValue = (vehicle: Vehicle) => {
  const routePathLength = vehicle.route?.path?.length ?? 0;
  const completedPathLength = vehicle.route?.completedPath?.length ?? 0;

  if (routePathLength < 2 || completedPathLength < 2) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((completedPathLength / routePathLength) * 100)
  );
};

const getStopsRemaining = (vehicle: Vehicle) => {
  const route = vehicle.route as
    | {
        stops?: unknown[];
        completedStops?: unknown[];
      }
    | undefined;

  const stopsCount = route?.stops?.length ?? 0;
  const completedStopsCount = route?.completedStops?.length ?? 0;
  const remaining = Math.max(0, stopsCount - completedStopsCount);

  return stopsCount > 0 ? `${remaining} stops remaining` : "Route in progress";
};

const getEta = (vehicle: Vehicle) => {
  const route = vehicle.route as
    | {
        eta?: string;
        estimatedArrival?: string;
      }
    | undefined;

  return route?.eta ?? route?.estimatedArrival ?? "ETA —";
};

const getDistanceLeft = (vehicle: Vehicle) => {
  const route = vehicle.route as
    | {
        distanceLeftKm?: number;
        remainingDistanceKm?: number;
      }
    | undefined;

  const distance = route?.distanceLeftKm ?? route?.remainingDistanceKm;

  return typeof distance === "number" ? `${distance.toFixed(1)} km` : "—";
};

const getNextStop = (vehicle: Vehicle) => {
  const route = vehicle.route as
    | {
        nextStop?: string;
        stops?: Array<string | { address?: string; title?: string }>;
        completedStops?: unknown[];
      }
    | undefined;

  if (route?.nextStop) {
    return route.nextStop;
  }

  const completedStopsCount = route?.completedStops?.length ?? 0;
  const nextStop = route?.stops?.[completedStopsCount];

  if (typeof nextStop === "string") {
    return nextStop;
  }

  return nextStop?.address ?? nextStop?.title ?? "—";
};

export const OrderDetailsWidget = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore((s) => s.selectedVehicleId);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
    vehicles[0] ??
    null;

  if (!selectedVehicle) {
    return (
      <Card className={styles.widget}>
        <div className={styles.topRow}>
          <div>
            <Badge tone="green">No vehicle</Badge>
            <h2 className={styles.title}>Select a vehicle</h2>
            <div className={styles.subtitle}>
              Vehicle details will appear here after loading.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const progress = getProgressValue(selectedVehicle);
  const eta = getEta(selectedVehicle);



  return (
    <Card className={styles.widget}>
      <div className={styles.topRow}>
        <div>
          <Badge tone="green">{getVehicleStatus(selectedVehicle)}</Badge>
          <h2 className={styles.title}>{formatVehicleTitle(selectedVehicle)}</h2>
          <div className={styles.subtitle}>
            {getStopsRemaining(selectedVehicle)} • {eta}
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div>
          <div className={styles.label}>Current Speed</div>
          <div className={styles.value}>{getCurrentSpeed(selectedVehicle)}</div>
        </div>

        <div>
          <div className={styles.label}>Driver</div>
          <div className={styles.value}>{getDriverName(selectedVehicle)}</div>
        </div>

        <div>
          <div className={styles.label}>Progress</div>
          <div className={styles.value}>{progress}%</div>
        </div>

        <div>
          <div className={styles.label}>Distance Left</div>
          <div className={styles.value}>{getDistanceLeft(selectedVehicle)}</div>
        </div>
      </div>

      <div className={styles.nextStop}>
        <div>
          <div className={styles.label}>Next Stop</div>
          <div className={styles.value}>{getNextStop(selectedVehicle)}</div>
        </div>

        <div>
          <div className={styles.label}>ETA</div>
          <div className={styles.value}>{eta}</div>
        </div>
      </div>

      <Progress value={progress} />

      <div className={styles.timeline}>
        <div>Selected vehicle: {selectedVehicle.id}</div>
        <div>Type: {selectedVehicle.type}</div>
        <div>Lng: {selectedVehicle.telemetry.lng.toFixed(5)}</div>
        <div>Lat: {selectedVehicle.telemetry.lat.toFixed(5)}</div>
        <div>Progress: {progress}%</div>
      </div>
    </Card>
  );
};
