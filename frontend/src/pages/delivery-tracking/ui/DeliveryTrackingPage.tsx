import { useEffect, useState } from "react";

import type { Client } from "@/entities/client";
import type { Driver } from "@/entities/driver";
import type { Order } from "@/entities/order";

import { fetchClients } from "@/shared/api/clients";
import { fetchDrivers } from "@/shared/api/drivers";
import { fetchOrders } from "@/shared/api/orders";

import { KpiCards } from "@/widgets/kpi-cards";
import { VehiclesPanel } from "@/widgets/vehicles-panel";
import { TrackingMap } from "@/widgets/tracking-map";
import { FiltersPanel } from "@/widgets/filters-panel";
import { OrderDetailsWidget } from "@/widgets/order-details";

import { HistoryMap } from "@/widgets/history-map";
import { HistoryOrdersPanel } from "@/widgets/history-orders-panel";
import { HistoryOrderDetails } from "@/widgets/history-order-details";

import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { useFleetStore } from "@/shared/store/fleet";

import styles from "./DeliveryTrackingPage.module.scss";

type TrackingView = "live" | "history";

export const DeliveryTrackingPage = () => {
  useLoadVehicles();

  const [view, setView] =
    useState<TrackingView>("live");

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [drivers, setDrivers] =
    useState<Driver[]>([]);

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const vehicles = useFleetStore(
    (state) => state.vehicles,
  );

  useEffect(() => {
    if (view !== "history") {
      return;
    }

    Promise.all([
      fetchOrders(),
      fetchClients(),
      fetchDrivers(),
    ])
      .then(
        ([
          ordersData,
          clientsData,
          driversData,
        ]) => {
          setOrders(ordersData);
          setClients(clientsData);
          setDrivers(driversData);
        },
      )
      .catch((error) => {
        console.error(
          "Failed to load history data",
          error,
        );
      });
  }, [view]);

  const selectedOrder =
    orders.find(
      (order) =>
        order.id === selectedOrderId,
    ) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.viewSwitcher}>
          <button
            type="button"
            className={`${styles.viewButton} ${
              view === "live"
                ? styles.active
                : ""
            }`}
            onClick={() => setView("live")}
          >
            Live
          </button>

          <button
            type="button"
            className={`${styles.viewButton} ${
              view === "history"
                ? styles.active
                : ""
            }`}
            onClick={() =>
              setView("history")
            }
          >
            History
          </button>
        </div>
      </div>

      {view === "live" && (
        <>
          <KpiCards />

          <div className={styles.mapSection}>
            <div className={styles.map}>
              <TrackingMap />
            </div>

            <div
              className={
                styles.vehiclesPanel
              }
            >
              <VehiclesPanel />
            </div>

            <div
              className={
                styles.filtersPanel
              }
            >
              <FiltersPanel />
            </div>
          </div>

          <OrderDetailsWidget />
        </>
      )}

      {view === "history" && (
        <div className={styles.historySection}>
          <div
            className={
              styles.historyMapSection
            }
          >
            <HistoryMap order={selectedOrder} />

            <HistoryOrdersPanel
              orders={orders}
              clients={clients}
              drivers={drivers}
              vehicles={vehicles}
              selectedOrderId={
                selectedOrderId
              }
              onSelectOrder={
                setSelectedOrderId
              }
            />
          </div>

         <HistoryOrderDetails
  order={selectedOrder}
  clients={clients}
  drivers={drivers}
  vehicles={vehicles}
/>
        </div>
      )}
    </div>
  );
};