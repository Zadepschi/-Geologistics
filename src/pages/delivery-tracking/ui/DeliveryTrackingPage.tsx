import { KpiCards } from "@/widgets/kpi-cards";
import { VehiclesPanel } from "@/widgets/vehicles-panel";
import { TrackingMap } from "@/widgets/tracking-map";
import { FiltersPanel } from "@/widgets/filters-panel";
import { OrderDetailsWidget } from "@/widgets/order-details";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import styles from "./DeliveryTrackingPage.module.scss";

export const DeliveryTrackingPage = () => {
  useLoadVehicles();

  return (
    <div className={styles.page}>
      <KpiCards />

      <div className={styles.topGrid}>
        <VehiclesPanel />
        <TrackingMap />
        <FiltersPanel />
      </div>

      <OrderDetailsWidget />
    </div>
  );
};