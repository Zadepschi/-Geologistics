import { useMemo, useState } from "react";

import type { Client } from "@/entities/client";
import type { Driver } from "@/entities/driver";
import type { Order } from "@/entities/order";
import type { Vehicle } from "@/entities/vehicle/model/types";

import styles from "./HistoryOrdersPanel.module.scss";

type HistoryOrdersPanelProps = {
  orders: Order[];
  clients: Client[];
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
};

export const HistoryOrdersPanel = ({
  orders,
  clients,
  drivers,
  vehicles,
  selectedOrderId,
  onSelectOrder,
}: HistoryOrdersPanelProps) => {
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      const client = clients.find(
        (item) => item.id === order.clientId,
      );

      const driver = drivers.find(
        (item) => item.id === order.driverId,
      );

      const vehicle = vehicles.find(
        (item) => item.id === order.vehicleId,
      );

      return (
        order.id.toLowerCase().includes(query) ||
        order.address.toLowerCase().includes(query) ||
        (client?.name ?? "")
          .toLowerCase()
          .includes(query) ||
        (driver?.name ?? "")
          .toLowerCase()
          .includes(query) ||
        (vehicle?.name ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    orders,
    clients,
    drivers,
    vehicles,
    search,
  ]);

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2>History Orders</h2>

          <span>
            {orders.length} orders
          </span>
        </div>
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon}>
          ⌕
        </span>

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search orders..."
        />

        {search && (
          <button
            type="button"
            className={styles.clearSearch}
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.list}>
        {filteredOrders.length === 0 ? (
          <div className={styles.empty}>
            No orders found
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected =
              order.id === selectedOrderId;

            const client = clients.find(
              (item) =>
                item.id === order.clientId,
            );

            const driver = drivers.find(
              (item) =>
                item.id === order.driverId,
            );

            const vehicle = vehicles.find(
              (item) =>
                item.id === order.vehicleId,
            );

            return (
              <button
                key={order.id}
                type="button"
                className={`${styles.order} ${
                  isSelected
                    ? styles.selected
                    : ""
                }`}
                onClick={() =>
                  onSelectOrder(order.id)
                }
              >
                <div className={styles.orderTop}>
                  <strong>
                    {order.id}
                  </strong>

                  <span
                    className={
                      styles.status
                    }
                  >
                    {order.status}
                  </span>
                </div>

                <div
                  className={
                    styles.client
                  }
                >
                  {client?.name ??
                    "Unknown client"}
                </div>

                <div
                  className={
                    styles.address
                  }
                >
                  {order.address}
                </div>

                <div
                  className={
                    styles.meta
                  }
                >
                  <span>
                    Driver:{" "}
                    {driver?.name ??
                      "Not assigned"}
                  </span>

                  <span>
                    Vehicle:{" "}
                    {vehicle?.name ??
                      "Not assigned"}
                  </span>
                </div>

                <div
                  className={
                    styles.meta
                  }
                >
                  <span>
                    Vehicle status: idle
                  </span>

                  <span>
                    ETA:{" "}
                    {typeof order.eta ===
                    "string"
                      ? order.eta.slice(0, 5)
                      : "—"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};