import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import styles from "./VehicleList.module.scss";

export const VehicleList = () => {
  useLoadVehicles();

  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useFleetStore((s) => s.setSelectedVehicleId);

  return (
    <Card className={styles.listCard}>
      <div className={styles.listHeader}>
        <h2>Vehicles</h2>
        <span>{vehicles.length}</span>
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