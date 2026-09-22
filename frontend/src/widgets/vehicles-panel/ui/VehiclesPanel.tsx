import { Card } from "@/shared/ui/card/Card";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import { useFleetStore } from "@/shared/store/fleet";

import styles from "./VehiclesPanel.module.scss";

export const VehiclesPanel = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useFleetStore(
    (s) => s.setSelectedVehicleId
  );

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Vehicles</div>
        <div className={styles.count}>{vehicles.length}</div>
      </div>

      <div className={styles.list}>
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            active={vehicle.id === selectedVehicleId}
            onClick={() => setSelectedVehicleId(vehicle.id)}
          />
        ))}
      </div>
    </Card>
  );
};