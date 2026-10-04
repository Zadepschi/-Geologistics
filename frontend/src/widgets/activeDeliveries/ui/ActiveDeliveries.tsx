import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import { fetchClients } from "@/shared/api/clients";
import type { Driver } from "@/entities/driver";
import { fetchDrivers } from "@/shared/api/drivers";
import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./ActiveDeliveries.module.scss";

export const ActiveDeliveries = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch((error) => {
        console.error("Failed to load clients", error);
      });
  }, []);

  useEffect(() => {
    fetchDrivers()
      .then(setDrivers)
      .catch((error) => {
        console.error("Failed to load drivers", error);
      });
  }, []);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error("Failed to load orders", error);
      });
  }, []);

  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

 const activeOrders = orders.filter(
  (order) =>
    order.status === "assigned" ||
    order.status === "in-progress" ||
    order.status === "delayed"
);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredOrders = activeOrders.filter((order) => {
    if (!normalizedSearch) {
      return true;
    }

    const vehicle = vehicles.find(
      (item) => item.id === order.vehicleId
    );

    const client = clients.find(
      (item) => item.id === order.clientId
    );

    return (
      order.id
        .toLowerCase()
        .includes(normalizedSearch) ||
      client?.name
        .toLowerCase()
        .includes(normalizedSearch) ||
      order.address
        .toLowerCase()
        .includes(normalizedSearch) ||
      vehicle?.name
        .toLowerCase()
        .includes(normalizedSearch)
    );
  });

const formatEta = (etaMinutes?: number) => {
  if (typeof etaMinutes !== "number") {
    return "—";
  }

  if (etaMinutes <= 0) {
    return "Arrived";
  }

  const hours = Math.floor(
    etaMinutes / 60
  );

  const minutes = etaMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Active Deliveries</h2>
        </div>

        <span className={styles.count}>
          {activeOrders.length} active
        </span>
      </div>

      <div className={styles.search}>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by order, client, address or vehicle..."
          aria-label="Search active deliveries"
        />
      </div>

      <div className={styles.list}>
        {filteredOrders.map((order) => {
          const vehicle = vehicles.find(
            (item) => item.id === order.vehicleId
          );

          const driver = drivers.find(
            (item) => item.id === order.driverId
          );

          const client = clients.find(
            (item) => item.id === order.clientId
          );

          return (
            <div
              key={order.id}
              className={styles.delivery}
            >
              <div className={styles.order}>
                <span className={styles.label}>
                  Order
                </span>

                <strong>{order.id}</strong>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>
                  Client
                </span>

                <strong>
                  {client?.name ??
                    "Unknown client"}
                </strong>
              </div>

              <div
                className={styles.destination}
              >
                <span className={styles.label}>
                  Destination
                </span>

                <strong>
                  {order.address}
                </strong>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>
                  Vehicle
                </span>

                <strong>
                  {vehicle?.name ??
                    "Not assigned"}
                </strong>

                <span className={styles.label}>
                  Driver
                </span>

                <strong>
                  {driver?.name ??
                    "Not assigned"}
                </strong>
              </div>

              <div className={styles.info}>
                <span className={styles.label}>
                  ETA
                </span>

                <strong>
                  {formatEta(
                    vehicle?.route?.etaMinutes
                  )}
                </strong>
              </div>

              <div className={styles.status}>
                <span className={styles.dot} />

                {order.status}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className={styles.empty}>
            {normalizedSearch
              ? "No active deliveries found."
              : "No active deliveries"}
          </div>
        )}
      </div>
    </Card>
  );
};