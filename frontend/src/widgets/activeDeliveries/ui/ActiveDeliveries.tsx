import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import { fetchClients } from "@/shared/api/clients";
import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./ActiveDeliveries.module.scss";

export const ActiveDeliveries = () => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch((error) => {
        console.error("Failed to load clients", error);
      });
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error("Failed to load orders", error);
      });
  }, []);

  const vehicles = useFleetStore((state) => state.vehicles);

  const activeOrders = orders.filter((order) => {
    if (order.status === "completed") {
      return false;
    }

    const vehicle = vehicles.find(
      (item) => item.id === order.vehicleId
    );

    return vehicle?.route?.deliveryCompleted !== true;
  });

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Active Deliveries</h2>
          <p>Current deliveries across New York</p>
        </div>

        <span className={styles.count}>
          {activeOrders.length} active
        </span>
      </div>

      <div className={styles.list}>
        {activeOrders.map((order) => {
          const vehicle = vehicles.find(
            (item) => item.id === order.vehicleId
          );

          const client = clients.find(
            (item) => item.id === order.clientId
          );

          return (
            <div key={order.id} className={styles.delivery}>
              <div className={styles.order}>
                <span className={styles.label}>Order</span>
                <strong>{order.id}</strong>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>Client</span>
                <strong>{client?.name ?? "Unknown client"}</strong>
              </div>

              <div className={styles.destination}>
                <span className={styles.label}>Destination</span>
                <strong>{order.address}</strong>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>Vehicle</span>
                <strong>
                  {vehicle?.name ?? "Not assigned"}
                </strong>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>ETA</span>
                <strong>{order.eta}</strong>
              </div>

              <div className={styles.status}>
                <span className={styles.dot} />
                {order.status}
              </div>
            </div>
          );
        })}

        {activeOrders.length === 0 && (
          <div className={styles.empty}>
            No active deliveries
          </div>
        )}
      </div>
    </Card>
  );
};
