import type { Client } from "@/entities/client";
import type { Driver } from "@/entities/driver";
import type { Order } from "@/entities/order";
import type { Vehicle } from "@/entities/vehicle/model/types";

import styles from "./HistoryOrderDetails.module.scss";

type HistoryOrderDetailsProps = {
  order: Order | null;
  clients: Client[];
  drivers: Driver[];
  vehicles: Vehicle[];
};

export const HistoryOrderDetails = ({
  order,
  clients,
  drivers,
  vehicles,
}: HistoryOrderDetailsProps) => {
  if (!order) {
    return (
      <section className={styles.panel}>
        <div className={styles.empty}>
          <strong>Select an order</strong>

          <span>
            Choose an order from the list to view its details and route.
          </span>
        </div>
      </section>
    );
  }

  const client = clients.find(
    (item) => item.id === order.clientId,
  );

  const driver = drivers.find(
    (item) => item.id === order.driverId,
  );

  const vehicle = vehicles.find(
    (item) => item.id === order.vehicleId,
  );

  const eta =
    typeof order.eta === "string"
      ? order.eta.slice(0, 5)
      : "—";

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.label}>
            Order
          </span>

          <h3>{order.id}</h3>
        </div>

        <span className={styles.status}>
          ✓ {order.status}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span>Client</span>

          <strong>
            {client?.name ?? "Unknown client"}
          </strong>
        </div>

        <div className={styles.item}>
          <span>Driver</span>

          <strong>
            {driver?.name ?? "Not assigned"}
          </strong>
        </div>

        <div className={styles.item}>
          <span>Vehicle</span>

          <strong>
            {vehicle?.name ?? "Not assigned"}
          </strong>
        </div>


        <div className={styles.item}>
          <span>ETA</span>

          <strong>{eta}</strong>
        </div>

        <div className={styles.item}>
          <span>Delivery address</span>

          <strong>{order.address}</strong>
        </div>
      </div>
    </section>
  );
};