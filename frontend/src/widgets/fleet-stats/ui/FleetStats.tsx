import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./FleetStats.module.scss";

export const FleetStats = () => {
  const vehicles = useFleetStore((s) => s.vehicles);

  const activeVehicles = vehicles.filter(
    (vehicle) =>
      !vehicle.isArchived &&
      (vehicle.status === "on-route" ||
        vehicle.status === "delayed") &&
      Boolean(vehicle.route) &&
      !vehicle.route?.deliveryCompleted
  );

  const availableVehicles = vehicles.filter(
    (vehicle) => !vehicle.isArchived
  );

  const stats = [
    {
      label: "On route",
      value: activeVehicles.filter(
        (vehicle) => vehicle.status === "on-route"
      ).length,
    },
    {
      label: "Idle",
      value: availableVehicles.filter(
        (vehicle) => vehicle.status === "idle"
      ).length,
    },
    {
      label: "Delayed",
      value: activeVehicles.filter(
        (vehicle) => vehicle.status === "delayed"
      ).length,
    },
    {
      label: "Maintenance",
      value: availableVehicles.filter(
        (vehicle) => vehicle.status === "maintenance"
      ).length,
    },
  ];

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Fleet Status</h2>
      </div>

      <div className={styles.stats}>
        {stats.map((item) => (
          <div key={item.label} className={styles.stat}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
};