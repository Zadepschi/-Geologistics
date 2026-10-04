import { useState } from "react";

import { KpiCards } from "@/widgets/kpi-cards";
import { VehiclesPanel } from "@/widgets/vehicles-panel";
import { TrackingMap } from "@/widgets/tracking-map";
import { FiltersPanel } from "@/widgets/filters-panel";
import { OrderDetailsWidget } from "@/widgets/order-details";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";

import styles from "./DeliveryTrackingPage.module.scss";

type TrackingView = "live" | "history";

export const DeliveryTrackingPage = () => {
  useLoadVehicles();

  const [view, setView] =
    useState<TrackingView>("live");

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

      {view === "live" && <KpiCards />}

      <div className={styles.mapSection}>
        <div className={styles.map}>
          <TrackingMap />
        </div>

        {view === "live" && (
          <>
            <div
              className={styles.vehiclesPanel}
            >
              <VehiclesPanel />
            </div>

            <div
              className={styles.filtersPanel}
            >
              <FiltersPanel />
            </div>
          </>
        )}
      </div>

      {view === "live" && (
        <OrderDetailsWidget />
      )}
    </div>
  );
};