import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./FleetStats.module.scss";

export const FleetStats = () => {
  const vehicles = useFleetStore((s) => s.vehicles);

  const stats = [
    {
      label: "Total",
      value: vehicles.length,
    },
{
  label: "On route",
  value: vehicles.filter(
    (vehicle) =>
      vehicle.status === "on-route"
  ).length,
},
    {
      label: "Idle",
      value: vehicles.filter(
        (vehicle) =>
          vehicle.status === "idle" ||
          vehicle.route?.deliveryCompleted
      ).length,
    },
    {
      label: "Delayed",
      value: vehicles.filter(
        (vehicle) => vehicle.status === "delayed"
      ).length,
    },
    {
      label: "Maintenance",
      value: vehicles.filter(
        (vehicle) => vehicle.status === "maintenance"
      ).length,
    },
  ];

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Fleet Overview</h2>
          <p>Current status of your New York delivery fleet</p>
        </div>

        <span className={styles.total}>
          {vehicles.length} vehicles
        </span>
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