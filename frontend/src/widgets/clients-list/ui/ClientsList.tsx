import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import { fetchClients } from "@/shared/api/clients";
import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";
import styles from "./ClientsList.module.scss";

export const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch((error) => {
        console.error("Failed to load clients", error);
      });
  }, []);

  useEffect(() => {
  fetchOrders()
    .then(setOrders)
    .catch((error) => {
      console.error("Failed to load orders", error);
    });
}, []);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Clients</h2>
        <span>{clients.length}</span>
      </div>

      <div className={styles.list}>
        {clients.map((client) => {
          const clientOrders = orders.filter(
            (order) => order.clientId === client.id
          );

          const lastOrder = clientOrders.at(-1);

          return (
            <div key={client.id} className={styles.clientCard}>
              <div className={styles.main}>
                <div>
                  <h3>{client.name}</h3>
                  <p>{client.email}</p>
                </div>

                <span className={styles.ordersCount}>
                  {clientOrders.length} orders
                </span>
              </div>

              <div className={styles.info}>
                <div>
                  <span>Phone</span>
                  <strong>{client.phone}</strong>
                </div>

                <div>
                  <span>Address</span>
                  <strong>{client.address}</strong>
                </div>

                <div>
                  <span>Last order</span>
                  <strong>{lastOrder?.id ?? "No orders"}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{lastOrder?.status ?? "—"}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};