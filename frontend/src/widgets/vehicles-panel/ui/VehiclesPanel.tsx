import { Card } from "@/shared/ui/card/Card";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import { useFleetStore } from "@/shared/store/fleet";

import styles from "./VehiclesPanel.module.scss";

interface VehiclesPanelProps {
  onVehicleSelect?: () => void;
}

export const VehiclesPanel = ({
  onVehicleSelect,
}: VehiclesPanelProps) => {
  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const selectedVehicleId = useFleetStore(
    (state) => state.selectedVehicleId
  );

  const setSelectedVehicleId = useFleetStore(
    (state) => state.setSelectedVehicleId
  );

  const activeVehicles = vehicles.filter(
    (vehicle) =>
      !vehicle.isArchived &&
      (
        vehicle.status === "on-route" ||
        vehicle.status === "delayed"
      ) &&
      Boolean(vehicle.route) &&
      !vehicle.route?.deliveryCompleted
  );

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    onVehicleSelect?.();
  };

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>
          Vehicles
        </div>

        <div className={styles.count}>
          {activeVehicles.length}
        </div>
      </div>

      <div className={styles.list}>
        {activeVehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            active={
              vehicle.id === selectedVehicleId
            }
            onClick={() =>
              handleVehicleSelect(vehicle.id)
            }
          />
        ))}

        {activeVehicles.length === 0 && (
          <div className={styles.empty}>
            No active vehicles
          </div>
        )}
      </div>
    </Card>
  );
};