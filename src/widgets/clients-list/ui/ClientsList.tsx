import { Card } from "@/shared/ui/card/Card";
import { clientsMock } from "@/entities/client";
import { ordersMock } from "@/entities/order/model/mock";
import styles from "./ClientsList.module.scss";

export const ClientsList = () => {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Clients</h2>
        <span>{clientsMock.length}</span>
      </div>

      <div className={styles.list}>
        {clientsMock.map((client) => {
          const clientOrders = ordersMock.filter(
            (order) => order.clientName === client.name
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