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

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

  const driverId =
    order.deliveryRoute?.driverId ?? order.driverId;

  const vehicleId =
    order.deliveryRoute?.vehicleId ?? order.vehicleId;

  const driver = drivers.find(
    (item) => item.id === driverId,
  );

  const vehicle = vehicles.find(
    (item) => item.id === vehicleId,
  );

  const startTime =
    order.deliveryRoute?.startedAt ??
    order.deliveryStartedAt;

  const completionTime =
    order.deliveryRoute?.completedAt ??
    order.deliveryCompletedAt;

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.label}>Order</span>
          <h3>{order.id}</h3>
        </div>

        <span className={styles.status}>
          ✓ {order.status.replace("-", " ")}
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
          <span>Start Time</span>
          <strong>{formatDateTime(startTime)}</strong>
        </div>

        <div className={styles.item}>
          <span>Completion Time</span>
          <strong>
            {formatDateTime(completionTime)}
          </strong>
        </div>

        <div className={styles.item}>
          <span>Delivery address</span>
          <strong>{order.address}</strong>
        </div>
      </div>
    </section>
  );
};