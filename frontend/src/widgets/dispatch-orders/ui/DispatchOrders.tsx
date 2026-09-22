import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import { fetchClients } from "@/shared/api/clients";
import type { Order } from "@/entities/order";
import {
  fetchOrders,
  updateOrderStatus,
} from "@/shared/api/orders";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./DispatchOrders.module.scss";

export const DispatchOrders = () => {
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

  const vehicles = useFleetStore((s) => s.vehicles);
  const setVehicles = useFleetStore((s) => s.setVehicles);

  useEffect(() => {
    const completedOrders = orders.filter((order) => {
      if (order.status === "completed") {
        return false;
      }

      const vehicle = vehicles.find(
        (item) => item.id === order.vehicleId
      );

      return vehicle?.route?.deliveryCompleted === true;
    });

    if (completedOrders.length === 0) {
      return;
    }

    let cancelled = false;

    const syncCompletedOrders = async () => {
      try {
        const updatedOrders = await Promise.all(
          completedOrders.map((order) =>
            updateOrderStatus(order.id, "completed")
          )
        );

        if (cancelled) {
          return;
        }

        setOrders((currentOrders) =>
          currentOrders.map((order) => {
            const updatedOrder = updatedOrders.find(
              (item) => item.id === order.id
            );

            return updatedOrder ?? order;
          })
        );
      } catch (error) {
        console.error(
          "Failed to sync completed delivery orders",
          error
        );
      }
    };

    syncCompletedOrders();

    return () => {
      cancelled = true;
    };
  }, [orders, vehicles]);

  const handleStartDelivery = async (order: Order) => {
    try {
      const updatedOrder = await updateOrderStatus(
        order.id,
        "in-progress"
      );

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === updatedOrder.id
            ? updatedOrder
            : item
        )
      );

      const vehicle = vehicles.find(
        (item) => item.id === order.vehicleId
      );

      if (vehicle) {
        setVehicles(
          vehicles.map((item) =>
            item.id === vehicle.id
              ? {
                  ...item,
                  status: "on-route",
                  route: item.route
                    ? {
                        ...item.route,
                        deliveryCompleted: false,
                      }
                    : item.route,
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error(
        `Failed to start delivery for order ${order.id}`,
        error
      );
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Orders</h2>
        <span>{orders.length}</span>
      </div>

      <div className={styles.list}>
        {orders.map((order) => {
          const assignedVehicle = vehicles.find(
            (vehicle) => vehicle.id === order.vehicleId
          );

          const client = clients.find(
            (item) => item.id === order.clientId
          );

          const displayedVehicleStatus =
            order.status === "completed"
              ? "idle"
              : assignedVehicle?.status ?? "—";

          return (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.top}>
                <div>
                  <h3>{order.id}</h3>
                  <p>{client?.name ?? "Unknown client"}</p>
                </div>

                <span className={styles.status}>
                  {order.status}
                </span>
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
                  <strong>
                    {assignedVehicle?.name ?? "Not assigned"}
                  </strong>
                </div>

                <div>
                  <span>Vehicle status</span>
                  <strong>{displayedVehicleStatus}</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button">
                  Assign vehicle
                </button>

                <button
                  type="button"
                  onClick={() => handleStartDelivery(order)}
                  disabled={
                    !assignedVehicle ||
                    assignedVehicle.status === "on-route" ||
                    order.status === "completed"
                  }
                >
                  Start delivery
                </button>

                <button type="button">
                  Mark completed
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
