import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import { fetchClients } from "@/shared/api/clients";
import type { Driver } from "@/entities/driver";
import { fetchDrivers } from "@/shared/api/drivers";
import type { Order } from "@/entities/order";
import {
  deleteOrder,
  fetchOrders,
  updateOrderStatus,
  updateOrderVehicle,
} from "@/shared/api/orders";
import { useFleetStore } from "@/shared/store/fleet";
import { geocodeAddress } from "@/shared/api/geocodeAddress";
import { fetchStreetRoute } from "@/shared/api/fetchStreetRoute";
import { AssignVehicleModal } from "@/pages/dispatch/ui/AssignVehicleModal";
import styles from "./DispatchOrders.module.scss";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

type OrderView = "active" | "completed";

interface DispatchOrdersProps {
  onEditOrder: (order: Order) => void;
}

export const DispatchOrders = ({
  onEditOrder,
}: DispatchOrdersProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [orderView, setOrderView] =
    useState<OrderView>("active");

  const [assignOrder, setAssignOrder] =
    useState<Order | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] =
    useState("");

  const [isAssigning, setIsAssigning] =
    useState(false);

  const [assignError, setAssignError] =
    useState("");

  const [actionErrors, setActionErrors] =
    useState<Record<string, string>>({});

  const [deletingOrderId, setDeletingOrderId] =
    useState<string | null>(null);

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch((error) => {
        console.error(
          "Failed to load clients",
          error
        );
      });
  }, []);

  useEffect(() => {
    fetchDrivers()
      .then(setDrivers)
      .catch((error) => {
        console.error(
          "Failed to load drivers",
          error
        );
      });
  }, []);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error(
          "Failed to load orders",
          error
        );
      });
  }, []);

  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const setVehicles = useFleetStore(
    (state) => state.setVehicles
  );

  const setVehicleRoutePath = useFleetStore(
    (state) => state.setVehicleRoutePath
  );

  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "idle"
  );

  const activeOrders = orders.filter(
    (order) =>
      order.status === "assigned" ||
      order.status === "in-progress" ||
      order.status === "delayed"
  );

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  );

  const visibleOrders =
    orderView === "active"
      ? activeOrders
      : completedOrders;

  const setOrderActionError = (
    orderId: string,
    message: string
  ) => {
    setActionErrors((current) => ({
      ...current,
      [orderId]: message,
    }));
  };

  const clearOrderActionError = (
    orderId: string
  ) => {
    setActionErrors((current) => {
      const next = { ...current };

      delete next[orderId];

      return next;
    });
  };

  /*
  useEffect(() => {
    const completedOrders = orders.filter(
      (order) => {
        if (order.status !== "in-progress") {
          return false;
        }

        const vehicle = vehicles.find(
          (item) => item.id === order.vehicleId
        );

        return (
          vehicle?.route?.deliveryCompleted ===
          true
        );
      }
    );

    if (completedOrders.length === 0) {
      return;
    }

    let cancelled = false;

    const syncCompletedOrders = async () => {
      try {
        const updatedOrders =
          await Promise.all(
            completedOrders.map((order) =>
              updateOrderStatus(
                order.id,
                "completed"
              )
            )
          );

        if (cancelled) {
          return;
        }

        setOrders((currentOrders) =>
          currentOrders.map((order) => {
            const updatedOrder =
              updatedOrders.find(
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
  */

const handleStartDelivery = async (
  order: Order
) => {
  clearOrderActionError(order.id);

  try {
    const vehicle = vehicles.find(
      (item) => item.id === order.vehicleId
    );

    if (!vehicle) {
      throw new Error(
        "Assigned vehicle was not found."
      );
    }

    if (!MAPBOX_TOKEN) {
      throw new Error(
        "Mapbox token is missing."
      );
    }

    if (
      typeof vehicle.telemetry.lat !== "number" ||
      typeof vehicle.telemetry.lng !== "number"
    ) {
      throw new Error(
        "Assigned vehicle does not have a valid location."
      );
    }

    /*
     * Строим маршрут непосредственно перед Start delivery.
     *
     * Это важно для новых заказов:
     * машина уже назначена при создании заказа,
     * поэтому handleAssignVehicle не вызывается.
     */
    const destination = await geocodeAddress(
      order.address
    );

    const start: [number, number] = [
      vehicle.telemetry.lng,
      vehicle.telemetry.lat,
    ];

    const finish: [number, number] = [
      destination.longitude,
      destination.latitude,
    ];

    const route = await fetchStreetRoute(
      start,
      finish,
      MAPBOX_TOKEN
    );

    if (route.length < 2) {
      throw new Error(
        "Route for delivery is empty."
      );
    }

    /*
     * Сохраняем маршрут в frontend store.
     * Именно отсюда карта получает vehicle.route.
     */
    setVehicleRoutePath(
      vehicle.id,
      route
    );

    /*
     * Обновляем локальное состояние машины.
     */
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

    /*
     * Переводим заказ в in-progress
     * и передаём тот же маршрут backend.
     */
    const updatedOrder =
      await updateOrderStatus(
        order.id,
        "in-progress",
        {
          start,
          finish,
          path: route,
        }
      );

    setOrders((currentOrders) =>
      currentOrders.map((item) =>
        item.id === updatedOrder.id
          ? updatedOrder
          : item
      )
    );
  } catch (error) {
    console.error(
      `Failed to start delivery for order ${order.id}`,
      error
    );

    setOrderActionError(
      order.id,
      error instanceof Error
        ? error.message
        : "Failed to start delivery."
    );
  }
};

  const handleMarkCompleted = async (
    order: Order
  ) => {
    clearOrderActionError(order.id);

    try {
      const updatedOrder =
        await updateOrderStatus(
          order.id,
          "completed"
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
                  status: "idle",
                  telemetry: {
                    ...item.telemetry,
                    speedKmH: 0,
                  },
                  route: item.route
                    ? {
                        ...item.route,
                        deliveryCompleted: true,
                      }
                    : item.route,
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error(
        `Failed to complete order ${order.id}`,
        error
      );

      setOrderActionError(
        order.id,
        error instanceof Error
          ? error.message
          : "Failed to complete order."
      );
    }
  };

  const handleDeleteOrder = async (
    order: Order
  ) => {
    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete order ${order.id}?`
    );

    if (!confirmed) {
      return;
    }

    clearOrderActionError(order.id);
    setDeletingOrderId(order.id);

    try {
      await deleteOrder(order.id);

      setOrders((currentOrders) =>
        currentOrders.filter(
          (item) => item.id !== order.id
        )
      );
    } catch (error) {
      console.error(
        `Failed to delete order ${order.id}`,
        error
      );

      setOrderActionError(
        order.id,
        error instanceof Error
          ? error.message
          : "Failed to delete order."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleOpenAssignVehicle = (
    order: Order
  ) => {
    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      return;
    }

    setAssignOrder(order);
    setSelectedVehicleId("");
    setAssignError("");
  };

  const handleCloseAssignVehicle = () => {
    if (isAssigning) {
      return;
    }

    setAssignOrder(null);
    setSelectedVehicleId("");
    setAssignError("");
  };

  const handleAssignVehicle = async () => {
    if (!assignOrder || !selectedVehicleId) {
      setAssignError(
        "Please select a vehicle."
      );
      return;
    }

    const selectedVehicle = vehicles.find(
      (vehicle) =>
        vehicle.id === selectedVehicleId
    );

    if (!selectedVehicle) {
      setAssignError(
        "Selected vehicle was not found."
      );
      return;
    }

    if (selectedVehicle.status !== "idle") {
      setAssignError(
        "Selected vehicle is no longer available."
      );
      return;
    }

    if (
      typeof selectedVehicle.telemetry.lat !==
        "number" ||
      typeof selectedVehicle.telemetry.lng !==
        "number"
    ) {
      setAssignError(
        "Selected vehicle does not have a valid location."
      );
      return;
    }

    if (!MAPBOX_TOKEN) {
      setAssignError(
        "Mapbox token is missing."
      );
      return;
    }

    setAssignError("");
    setIsAssigning(true);

    try {
      const destination =
        await geocodeAddress(
          assignOrder.address
        );

      const start: [number, number] = [
        selectedVehicle.telemetry.lng,
        selectedVehicle.telemetry.lat,
      ];

      const finish: [number, number] = [
        destination.longitude,
        destination.latitude,
      ];

      const route = await fetchStreetRoute(
        start,
        finish,
        MAPBOX_TOKEN
      );

      if (route.length < 2) {
        throw new Error(
          "Route for selected vehicle is empty."
        );
      }

      const updatedOrder =
        await updateOrderVehicle(
          assignOrder.id,
          selectedVehicleId
        );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id
            ? updatedOrder
            : order
        )
      );

      setVehicleRoutePath(
        selectedVehicle.id,
        route
      );

      setAssignOrder(null);
      setSelectedVehicleId("");
      setAssignError("");
    } catch (error) {
      console.error(
        `Failed to assign vehicle to order ${assignOrder.id}`,
        error
      );

      setAssignError(
        error instanceof Error
          ? error.message
          : "Failed to assign vehicle."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2>Orders</h2>

          <div className={styles.headerActions}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={
                  orderView === "active"
                    ? styles.tabActive
                    : styles.tab
                }
                onClick={() =>
                  setOrderView("active")
                }
              >
                Active
                <span>{activeOrders.length}</span>
              </button>

              <button
                type="button"
                className={
                  orderView === "completed"
                    ? styles.tabActive
                    : styles.tab
                }
                onClick={() =>
                  setOrderView("completed")
                }
              >
                Completed
                <span>{completedOrders.length}</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.list}>
          {visibleOrders.map((order) => {
            const assignedVehicle =
              vehicles.find(
                (vehicle) =>
                  vehicle.id === order.vehicleId
              );

            const driver = drivers.find(
              (item) =>
                item.id === order.driverId
            );

            const client = clients.find(
              (item) =>
                item.id === order.clientId
            );

            const displayedVehicleStatus =
              order.status === "completed"
                ? "idle"
                : assignedVehicle?.status ?? "—";

            const canAssignVehicle =
              order.status !== "in-progress" &&
              order.status !== "completed";

          const canStartDelivery =
  order.status === "assigned" &&
  !!assignedVehicle;

            const canMarkCompleted =
              order.status !== "completed";

            const canEdit =
              order.status === "assigned" ||
              order.status === "delayed";

            const canDelete =
              order.status === "assigned" ||
              order.status === "delayed";

            const actionError =
              actionErrors[order.id];

            const hasActions =
              canAssignVehicle ||
              canStartDelivery ||
              canMarkCompleted ||
              canEdit ||
              canDelete;

            const isDeleting =
              deletingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={styles.orderCard}
              >
                <div className={styles.top}>
                  <div>
                    <h3>{order.id}</h3>

                    <p>
                      {client?.name ??
                        "Unknown client"}
                    </p>
                  </div>

                  <span
                    className={styles.status}
                  >
                    {order.status}
                  </span>
                </div>

                <div className={styles.info}>
                  <div>
                    <span>Address</span>

                    <strong>
                      {order.address}
                    </strong>
                  </div>

                  <div>
                    <span>ETA</span>

                    <strong>
                      {typeof order.eta ===
                      "string"
                        ? order.eta.slice(0, 5)
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Vehicle</span>

                    <strong>
                      {assignedVehicle?.name ??
                        "Not assigned"}
                    </strong>
                  </div>

                  <div>
                    <span>Driver</span>

                    <strong>
                      {driver?.name ??
                        "Not assigned"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Vehicle status
                    </span>

                    <strong>
                      {displayedVehicleStatus}
                    </strong>
                  </div>
                </div>

                {actionError && (
                  <p
                    className={
                      styles.actionError
                    }
                  >
                    {actionError}
                  </p>
                )}

                {hasActions && (
                  <div
                    className={styles.actions}
                  >
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          onEditOrder(order)
                        }
                        disabled={isDeleting}
                      >
                        Edit
                      </button>
                    )}

                    {canAssignVehicle && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenAssignVehicle(
                            order
                          )
                        }
                        disabled={isDeleting}
                      >
                        Assign vehicle
                      </button>
                    )}

                    {canStartDelivery && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStartDelivery(
                            order
                          )
                        }
                        disabled={isDeleting}
                      >
                        Start delivery
                      </button>
                    )}

                    {canMarkCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkCompleted(
                            order
                          )
                        }
                        disabled={isDeleting}
                      >
                        Mark completed
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteOrder(
                            order
                          )
                        }
                        disabled={isDeleting}
                      >
                        {isDeleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visibleOrders.length === 0 && (
            <div className={styles.empty}>
              {orderView === "active"
                ? "No active orders."
                : "No completed orders."}
            </div>
          )}
        </div>
      </Card>

      <AssignVehicleModal
        open={!!assignOrder}
        orderId={assignOrder?.id ?? ""}
        vehicles={availableVehicles}
        selectedVehicleId={selectedVehicleId}
        isAssigning={isAssigning}
        error={assignError}
        onVehicleChange={
          setSelectedVehicleId
        }
        onClose={
          handleCloseAssignVehicle
        }
        onAssign={
          handleAssignVehicle
        }
      />
    </>
  );
};