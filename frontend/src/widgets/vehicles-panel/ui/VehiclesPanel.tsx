import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card/Card";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import { useFleetStore } from "@/shared/store/fleet";
import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";

import styles from "./VehiclesPanel.module.scss";

export const VehiclesPanel = () => {
  const vehicles = useFleetStore((s) => s.vehicles);

  const selectedVehicleId = useFleetStore(
    (s) => s.selectedVehicleId
  );

  const setSelectedVehicleId = useFleetStore(
    (s) => s.setSelectedVehicleId
  );

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error(
          "Failed to load orders for vehicles panel",
          error
        );
      });
  }, []);

  const activeVehicleIds = new Set(
    orders
      .filter(
        (order) =>
          order.status === "in-progress" ||
          order.status === "delayed"
      )
      .map((order) => order.vehicleId)
  );

  

  const activeVehicles = vehicles.filter(
  (vehicle) =>
    !vehicle.isArchived &&
    activeVehicleIds.has(vehicle.id)
);
  

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Vehicles</div>
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