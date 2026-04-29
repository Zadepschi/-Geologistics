import { FleetStats } from "@/widgets/fleet-stats";
import { VehicleList } from "@/widgets/vehicle-list";
import { VehicleDetails } from "@/widgets/vehicle-details";
import styles from "./FleetPage.module.scss";

export const FleetPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>Manage and monitor all vehicles.</p>
        </div>
      </div>

      <FleetStats />

      <div className={styles.contentGrid}>
        <VehicleList />
        <VehicleDetails />
      </div>
    </div>
  );
};