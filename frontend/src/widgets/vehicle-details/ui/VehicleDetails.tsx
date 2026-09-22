import { useEffect, useState } from "react";

import { Card } from "@/shared/ui/card/Card";
import type { Client } from "@/entities/client";
import type { Driver } from "@/entities/driver";
import type { Order } from "@/entities/order";
import { fetchClients } from "@/shared/api/clients";
import { fetchDrivers } from "@/shared/api/drivers";
import { fetchOrders } from "@/shared/api/orders";
import { useFleetStore } from "@/shared/store/fleet";

import styles from "./VehicleDetails.module.scss";

export const VehicleDetails = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

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

  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore(
    (s) => s.selectedVehicleId
  );

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
    null;

  const selectedOrder = selectedVehicle
    ? orders.find(
        (order) => order.vehicleId === selectedVehicle.id
      ) ?? null
    : null;

  const selectedClient = selectedOrder
    ? clients.find(
        (client) => client.id === selectedOrder.clientId
      ) ?? null
    : null;

  const selectedDriver = selectedVehicle
    ? drivers.find(
        (driver) => driver.vehicleId === selectedVehicle.id
      ) ?? null
    : null;

  return (
    <Card className={styles.detailsCard}>
      <h2>Vehicle details</h2>

      {selectedVehicle ? (
        <div className={styles.details}>
          <div>
            <span>Vehicle</span>
            <strong>{selectedVehicle.name}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{selectedVehicle.status}</strong>
          </div>

          <div>
            <span>Driver</span>
            <strong>{selectedDriver?.name ?? "No driver"}</strong>
          </div>

          <div>
            <span>Speed</span>
            <strong>
              {selectedVehicle.telemetry.speedKmH ?? 0} km/h
            </strong>
          </div>

          <div>
            <span>Order</span>
            <strong>
              {selectedOrder?.id ?? "No active order"}
            </strong>
          </div>

          <div>
            <span>Client</span>
            <strong>{selectedClient?.name ?? "—"}</strong>
          </div>

          <div>
            <span>Address</span>
            <strong>{selectedOrder?.address ?? "—"}</strong>
          </div>

          <div>
            <span>ETA</span>
            <strong>
              {selectedVehicle.route?.etaMinutes
                ? `${selectedVehicle.route.etaMinutes} min`
                : selectedOrder?.eta ?? "—"}
            </strong>
          </div>

          <div>
            <span>Delivery</span>
            <strong>
              {selectedVehicle.route?.deliveryCompleted
                ? "Completed"
                : "In progress"}
            </strong>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>
          Select a vehicle to see details.
        </p>
      )}
    </Card>
  );
};