import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";

import type { Client } from "@/entities/client";
import { fetchClients } from "@/shared/api/clients";

import type { Driver } from "@/entities/driver";
import { fetchDrivers } from "@/shared/api/drivers";

import type { Order } from "@/entities/order";

import {
  fetchOrders,
  updateOrderStatus,
  updateOrderVehicle,
  updateOrderDriver,
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

/**
 * Converts values to searchable text.
 * Handles nested objects and arrays without assuming a fixed Order schema.
 */
const normalizeSearchValue = (value: unknown): string => {
  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(normalizeSearchValue).join(" ").toLowerCase();
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(normalizeSearchValue)
      .join(" ")
      .toLowerCase();
  }

  return String(value).toLowerCase();
};


const formatRemainingTime = (minutes: number | undefined): string => {
  if (minutes == null || !Number.isFinite(minutes)) {
    return "—";
  }

  const remaining = Math.max(0, Math.ceil(minutes));
  const hours = Math.floor(remaining / 60);
  const mins = remaining % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${mins} min`;
};


export const DispatchOrders = ({ onEditOrder }: DispatchOrdersProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [orderView, setOrderView] = useState<OrderView>("active");
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
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

  const vehicles = useFleetStore((state) => state.vehicles);
  const setVehicles = useFleetStore((state) => state.setVehicles);
  const setVehicleRouteState = useFleetStore(
    (state) => state.setVehicleRouteState
  );

 
const availableVehicles = vehicles.filter(
  (vehicle) =>
    vehicle.status === "idle" &&
    !vehicle.isArchived
);

  
const availableDrivers = drivers.filter(
  (driver) =>
    driver.status === "available" &&
    (!driver.vehicleId || driver.vehicleId === selectedVehicleId),
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

  const visibleOrders = (
  orderView === "active" ? activeOrders : completedOrders
).slice().reverse();

  const query = normalizeSearchValue(search).trim();

  const filteredOrders = visibleOrders.filter((order) => {
    const client = clients.find((item) => item.id === order.clientId);
    const driver = drivers.find((item) => item.id === order.driverId);
    const vehicle = vehicles.find((item) => item.id === order.vehicleId);

    // Search all fields on the order and its related client, driver and vehicle.
    const searchableText = normalizeSearchValue({
      order,
      client,
      driver,
      vehicle,
    });

    return searchableText.includes(query);
  });

  const setOrderActionError = (orderId: string, message: string) => {
    setActionErrors((current) => ({
      ...current,
      [orderId]: message,
    }));
  };

  const clearOrderActionError = (orderId: string) => {
    setActionErrors((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });
  };

  const handleStartDelivery = async (order: Order) => {
    clearOrderActionError(order.id);

    try {
      const vehicle = vehicles.find((item) => item.id === order.vehicleId);

      if (!vehicle) {
        throw new Error("Assigned vehicle was not found.");
      }

      if (!MAPBOX_TOKEN) {
        throw new Error("Mapbox token is missing.");
      }

      if (
        typeof vehicle.telemetry.lat !== "number" ||
        typeof vehicle.telemetry.lng !== "number"
      ) {
        throw new Error("Assigned vehicle does not have a valid location.");
      }

     
let destination: { longitude: number; latitude: number };

if (
  typeof order.longitude === "number" &&
  typeof order.latitude === "number" &&
  Number.isFinite(order.longitude) &&
  Number.isFinite(order.latitude) &&
  order.longitude >= -180 &&
  order.longitude <= 180 &&
  order.latitude >= -90 &&
  order.latitude <= 90
) {
  destination = {
    longitude: order.longitude,
    latitude: order.latitude,
  };
} else {
  const fullAddress = [
    order.address,
    order.city,
    order.postalCode,
    "New Mexico",
    "United States",
  ]
    .filter(Boolean)
    .join(", ");

  destination = await geocodeAddress(fullAddress);
}


      const start: [number, number] = [
        vehicle.telemetry.lng,
        vehicle.telemetry.lat,
      ];

      const finish: [number, number] = [
        destination.longitude,
        destination.latitude,
      ];

   
console.log(
  "Delivery route debug:",
  JSON.stringify(
    {
      orderId: order.id,
      address: order.address,
      vehicleLocation: {
        longitude: start[0],
        latitude: start[1],
      },
      geocodedDestination: {
        longitude: finish[0],
        latitude: finish[1],
      },
      distanceKm: (
        6371 *
        2 *
        Math.asin(
          Math.sqrt(
            Math.sin(((finish[1] - start[1]) * Math.PI) / 360) ** 2 +
              Math.cos((start[1] * Math.PI) / 180) *
                Math.cos((finish[1] * Math.PI) / 180) *
                Math.sin(((finish[0] - start[0]) * Math.PI) / 360) ** 2
          )
        )
      ).toFixed(2),
    },
    null,
    2
  )
);


      const route = await fetchStreetRoute(start, finish, MAPBOX_TOKEN);

      if (route.length < 2) {
        throw new Error("Route for delivery is empty.");
      }

      /*
       * PostgreSQL is the source of truth.
       * The route is saved by the backend together with the transition to in-progress.
       */
      const updatedOrder = await updateOrderStatus(order.id, "in-progress", {
        start,
        finish,
        path: route,
      });

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === updatedOrder.id ? updatedOrder : item
        )
      );

      /*
       * The backend returns the persisted delivery route.
       * Only after successful persistence do we update the frontend runtime state.
       */
      const deliveryRoute = updatedOrder.deliveryRoute;

      if (deliveryRoute) {
        const currentPathIndex = Math.max(
          0,
          Math.min(
            deliveryRoute.currentPathIndex,
            deliveryRoute.path.length - 1
          )
        );

        const completedPath = deliveryRoute.completedPath?.length
          ? deliveryRoute.completedPath
          : deliveryRoute.path.slice(0, currentPathIndex + 1);

        setVehicleRouteState(vehicle.id, {
          orderId: deliveryRoute.orderId,
          start: deliveryRoute.start,
          finish: deliveryRoute.finish,
          path: deliveryRoute.path,
          completedPath,
          currentPathIndex,
          deliveryCompleted: Boolean(deliveryRoute.completedAt),
          etaMinutes: 0,
        });
      }
    } catch (error) {
      console.error(`Failed to start delivery for order ${order.id}`, error);

      setOrderActionError(
        order.id,
        error instanceof Error ? error.message : "Failed to start delivery."
      );
    }
  };

  const handleMarkCompleted = async (order: Order) => {
    clearOrderActionError(order.id);

    try {
      const updatedOrder = await updateOrderStatus(order.id, "completed");

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === updatedOrder.id ? updatedOrder : item
        )
      );

      const vehicle = vehicles.find((item) => item.id === order.vehicleId);

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
      console.error(`Failed to complete order ${order.id}`, error);

      setOrderActionError(
        order.id,
        error instanceof Error ? error.message : "Failed to complete order."
      );
    }
  };


const handleOpenAssignVehicle = (order: Order) => {
  if (order.status === "in-progress" || order.status === "completed") {
    return;
  }

  setAssignOrder(order);
  setSelectedVehicleId("");
  setSelectedDriverId("");
  setAssignError("");
};


  const handleCloseAssignVehicle = () => {
    if (isAssigning) {
      return;
    }

    setAssignOrder(null);
    setSelectedVehicleId("");
    setAssignError("");
    setSelectedDriverId("");
  };

 
const handleAssignVehicle = async () => {
  if (!assignOrder) {
    setAssignError("Order not found.");
    return;
  }

  if (!selectedVehicleId || !selectedDriverId) {
    setAssignError("Please select both a vehicle and a driver.");
    return;
  }

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === selectedVehicleId
  );

  if (!selectedVehicle || selectedVehicle.status !== "idle") {
    setAssignError("Selected vehicle is no longer available.");
    return;
  }

  setAssignError("");
  setIsAssigning(true);

  try {
    await updateOrderVehicle(assignOrder.id, selectedVehicleId);

    await updateOrderDriver(assignOrder.id, selectedDriverId);

    const [refreshedOrders, refreshedDrivers] = await Promise.all([
  fetchOrders(),
  fetchDrivers(),
]);

setOrders(refreshedOrders);
setDrivers(refreshedDrivers);

    setAssignOrder(null);
    setSelectedVehicleId("");
    setSelectedDriverId("");
    setAssignError("");
  } catch (error) {
    console.error("Failed to assign vehicle and driver", error);

    try {
      setOrders(await fetchOrders());
    } catch (refreshError) {
      console.error("Failed to refresh orders", refreshError);
    }

    setAssignError(
      error instanceof Error
        ? error.message
        : "Failed to assign vehicle and driver."
    );
  } finally {
    setIsAssigning(false);
  }
};


  return (
    <>
      <Card className={styles.card}>
        <div className={styles.stickyHeader}>
        <div className={styles.header}>
          <h2>Orders</h2>

          <div className={styles.headerActions}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={
                  orderView === "active" ? styles.tabActive : styles.tab
                }
                onClick={() => setOrderView("active")}
              >
                Active
                <span>{activeOrders.length}</span>
              </button>

              <button
                type="button"
                className={
                  orderView === "completed" ? styles.tabActive : styles.tab
                }
                onClick={() => setOrderView("completed")}
              >
                Completed
                <span>{completedOrders.length}</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.search}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by anything: order, address, client, driver, vehicle..."
            aria-label="Search orders by any field"
          />
        </div>
        </div>

        <div className={styles.list}>
          {filteredOrders.map((order) => {
            const assignedVehicle = vehicles.find(
              (vehicle) => vehicle.id === order.vehicleId
            );

            const driver = drivers.find((item) => item.id === order.driverId);
            const client = clients.find((item) => item.id === order.clientId);

            const displayedVehicleStatus =
              order.status === "completed"
                ? "idle"
                : assignedVehicle?.status ?? "—";

            const canAssignVehicle =
              order.status !== "in-progress" &&
              order.status !== "completed";

           const canStartDelivery =
  order.status === "assigned" &&
  !!assignedVehicle &&
  !!order.driverId;

            const canMarkCompleted = order.status !== "completed";

            const canEdit =
              order.status === "assigned" || order.status === "delayed";

            const actionError = actionErrors[order.id];

            const hasActions =
              canAssignVehicle ||
              canStartDelivery ||
              canMarkCompleted ||
              canEdit;

            return (
              <div key={order.id} className={styles.orderCard}>
               <div className={styles.top}>
  <div>
    <h3>{order.id}</h3>
    <p>{client?.name ?? "Unknown client"}</p>

    {client?.source?.toLowerCase() === "stylebox" && (
      <span className={styles.sourceBadge}>STYLEBOX</span>
    )}
  </div>

  <span className={styles.status}>{order.status}</span>
</div>

                <div className={styles.info}>
                  <div>
  <span>Address</span>
  <strong>
    {[
      order.address,
      order.city,
      order.postalCode,
    ]
      .filter(Boolean)
      .join(", ")}
  </strong>
</div>

                
<div>
  <span>ETA</span>
  
 <strong>
  {order.status === "in-progress" ||
  order.status === "delayed"
    ? formatRemainingTime(assignedVehicle?.route?.etaMinutes)
    : "—"}
</strong>
</div>


                  <div>
                    <span>Vehicle</span>
                    <strong>{assignedVehicle?.name ?? "Not assigned"}</strong>
                  </div>

                  <div>
                    <span>Driver</span>
                    <strong>{driver?.name ?? "Not assigned"}</strong>
                  </div>

                  <div>
                    <span>Vehicle status</span>
                    <strong>{displayedVehicleStatus}</strong>
                  </div>
                </div>

                {actionError && (
                  <p className={styles.actionError}>{actionError}</p>
                )}

                {hasActions && (
                  <div className={styles.actions}>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                      >
                        Edit
                      </button>
                    )}

                    {canAssignVehicle && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignVehicle(order)}
                      >
                        Assign vehicle
                      </button>
                    )}

                    {canStartDelivery && (
                      <button
                        type="button"
                        onClick={() => handleStartDelivery(order)}
                      >
                        Start delivery
                      </button>
                    )}

                    {canMarkCompleted && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(order)}
                      >
                        Mark completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className={styles.empty}>
              {search.trim()
                ? "No orders match your search."
                : orderView === "active"
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
        onVehicleChange={setSelectedVehicleId}
        onClose={handleCloseAssignVehicle}
        onAssign={handleAssignVehicle}
        drivers={availableDrivers}
        selectedDriverId={selectedDriverId}
        onDriverChange={setSelectedDriverId}
      />
    </>
  );
};
