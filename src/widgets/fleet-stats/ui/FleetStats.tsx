import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import styles from "./FleetStats.module.scss";

export const FleetStats = () => {
  useLoadVehicles();

  const vehicles = useFleetStore((s) => s.vehicles);

  const stats = [
    {
      label: "Total",
      value: vehicles.length,
    },
    {
      label: "On route",
      value: vehicles.filter((vehicle) => vehicle.status === "on-route").length,
    },
    {
      label: "Idle",
      value: vehicles.filter((vehicle) => vehicle.status === "idle").length,
    },
    {
      label: "Delayed",
      value: vehicles.filter((vehicle) => vehicle.status === "delayed").length,
    },
    {
      label: "Maintenance",
      value: vehicles.filter((vehicle) => vehicle.status === "maintenance")
        .length,
    },
  ];

  return (
    <div className={styles.stats}>
      {stats.map((item) => (
        <Card key={item.label} className={styles.statCard}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </Card>
      ))}
    </div>
  );
};