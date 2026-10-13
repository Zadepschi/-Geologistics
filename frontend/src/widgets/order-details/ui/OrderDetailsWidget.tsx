import { useEffect, useState } from "react";

import { Card } from "@/shared/ui/card/Card";
import { Badge } from "@/shared/ui/badge/Badge";
import { Progress } from "@/shared/ui/progress/Progress";

import { useFleetStore } from "@/shared/store/fleet";

import { fetchDrivers } from "@/shared/api/drivers";
import { fetchOrders } from "@/shared/api/orders";
import { fetchClients } from "@/shared/api/clients";

import type { Driver } from "@/entities/driver";
import type { Vehicle } from "@/entities/vehicle/model/types";
import type { Order } from "@/entities/order";
import type { Client } from "@/entities/client";

import styles from "./OrderDetailsWidget.module.scss";

const ACTIVE_ORDER_STATUSES = [
  "assigned",
  "in-progress",
  "delayed",
];

const isOrderActive = (order: Order) =>
  ACTIVE_ORDER_STATUSES.includes(order.status);

const getVehicleStatus = (vehicle: Vehicle) =>
  vehicle.status;

const getDriverName = (
  vehicle: Vehicle,
  drivers: Driver[],
  order?: Order
) => {
  const driverId =
    order?.deliveryRoute?.driverId ??
    order?.driverId;

  const driverById = drivers.find(
    (driver) =>
      driver.id === driverId &&
      !driver.isArchived
  );

  if (driverById) {
    return driverById.name;
  }

  const driverByVehicle = drivers.find(
    (driver) =>
      driver.vehicleId === vehicle.id &&
      !driver.isArchived
  );

  return driverByVehicle?.name ?? "Not assigned";
};

const getClient = (
  order: Order | undefined,
  clients: Client[]
) =>
  clients.find(
    (client) => client.id === order?.clientId
  );

const getEta = (vehicle: Vehicle) => {
  if (
    vehicle.route?.deliveryCompleted ||
    vehicle.status === "idle"
  ) {
    return "Completed";
  }

  const eta = vehicle.route?.etaMinutes;

  if (typeof eta !== "number") {
    return "—";
  }

  const hours = Math.floor(eta / 60);
  const minutes = eta % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

const getProgressValue = (vehicle: Vehicle) => {
  const total = vehicle.route?.path.length ?? 0;
  const completed =
    vehicle.route?.completedPath?.length ?? 0;

  if (total < 2 || completed < 2) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((completed / total) * 100)
  );
};

export const OrderDetailsWidget = () => {
  const vehicles = useFleetStore((state) => state.vehicles);

  const selectedVehicleId = useFleetStore(
    (state) => state.selectedVehicleId
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [
          driversData,
          ordersData,
          clientsData,
        ] = await Promise.all([
          fetchDrivers(),
          fetchOrders(),
          fetchClients(),
        ]);

        if (!cancelled) {
          setDrivers(driversData);
          setOrders(ordersData);
          setClients(clientsData);
        }
      } catch (error) {
        console.error(
          "Failed to load order details:",
          error
        );
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeOrders = orders.filter(isOrderActive);

  const selectedVehicle =
    vehicles.find(
      (vehicle) => vehicle.id === selectedVehicleId
    ) ?? null;

  const routeOrderId = selectedVehicle?.route?.orderId;

  const selectedOrder = activeOrders.find(
    (order) =>
      order.id === routeOrderId ||
      order.deliveryRoute?.orderId === routeOrderId
  );

  if (
  activeOrders.length === 0 ||
  !selectedVehicle ||
  !selectedOrder
) {
  return (
    <Card className={styles.widget}>
      <div className={styles.empty}>
        <strong>No Active Orders.   </strong>
        <span>
           All deliveries are completed. New orders will appear here.
        </span>
      </div>
    </Card>
  );
}

  const client = getClient(selectedOrder, clients);
  const progress = getProgressValue(selectedVehicle);

  return (
    <Card className={styles.widget}>
      <div className={styles.vehicle}>
        <Badge tone="green">
          {getVehicleStatus(selectedVehicle)}
        </Badge>

        <strong className={styles.title}>
          Order: {selectedOrder.id}
        </strong>

        <span className={styles.vehicleName}>
          Vehicle: {selectedVehicle.name}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.details}>
        <div className={styles.stat}>
          <span>Client</span>
          <strong>
            {client?.name ?? "Unknown client"}
          </strong>
        </div>

        <div className={styles.stat}>
          <span>Driver</span>
          <strong>
            {getDriverName(
              selectedVehicle,
              drivers,
              selectedOrder
            )}
          </strong>
        </div>

        <div className={`${styles.stat} ${styles.address}`}>
          <span>Delivery address</span>
          <strong>
            {client?.address ??
              selectedOrder.address ??
              "Address unavailable"}
          </strong>
        </div>

        <div className={styles.stat}>
          <span>ETA</span>
          <strong>{getEta(selectedVehicle)}</strong>
        </div>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressHeader}>
          <span>Delivery progress</span>
          <strong>{progress}%</strong>
        </div>

        <Progress value={progress} />
      </div>
    </Card>
  );
};