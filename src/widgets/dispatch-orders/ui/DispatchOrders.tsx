import { Card } from "@/shared/ui/card/Card";
import { ordersMock } from "@/entities/order/model/mock";
import { useFleetStore } from "@/shared/store/fleet";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import styles from "./DispatchOrders.module.scss";

export const DispatchOrders = () => {
  useLoadVehicles();

  const vehicles = useFleetStore((s) => s.vehicles);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Orders</h2>
        <span>{ordersMock.length}</span>
      </div>

      <div className={styles.list}>
        {ordersMock.map((order) => {
          const assignedVehicle = vehicles.find(
            (vehicle) => vehicle.id === order.vehicleId
          );

          return (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.top}>
                <div>
                  <h3>{order.id}</h3>
                  <p>{order.clientName}</p>
                </div>

                <span className={styles.status}>{order.status}</span>
              </div>

              <div className={styles.info}>
                <div>
                  <span>Address</span>
                  <strong>{order.address}</strong>
                </div>

                <div>
                  <span>ETA</span>
                  <strong>{order.eta}</strong>
                </div>

                <div>
                  <span>Vehicle</span>
                  <strong>{assignedVehicle?.name ?? "Not assigned"}</strong>
                </div>

                <div>
                  <span>Vehicle status</span>
                  <strong>{assignedVehicle?.status ?? "—"}</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button">Assign vehicle</button>
                <button type="button">Start delivery</button>
                <button type="button">Mark completed</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};