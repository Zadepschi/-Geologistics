import { Card } from "@/shared/ui/card/Card";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import { useFleetStore } from "@/shared/store/fleet";

import styles from "./VehiclesPanel.module.scss";

export const VehiclesPanel = () => {
  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const selectedVehicleId = useFleetStore(
    (state) => state.selectedVehicleId
  );

  const setSelectedVehicleId = useFleetStore(
    (state) => state.setSelectedVehicleId
  );

  /*
   * Заказы здесь больше не загружаем.
   *
   * useLoadVehicles() уже получает orders из backend
   * и восстанавливает route непосредственно в Zustand.
   *
   * Поэтому VehiclesPanel использует только состояние
   * vehicles из store.
   */

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
              setSelectedVehicleId(vehicle.id)
            }
          />
        ))}
      </div>
    </Card>
  );
};