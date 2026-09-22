import { KpiCards } from "@/widgets/kpi-cards";
import { FleetStats } from "@/widgets/fleet-stats";
import { RecentActivity } from "@/widgets/recent-activity";
import { ActiveDeliveries } from "@/widgets/activeDeliveries";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";

import styles from "./DashboardPage.module.scss";

export const DashboardPage = () => {
  useLoadVehicles();

  return (
    <div className={styles.page}>
      <KpiCards />

      <FleetStats />

      <div className={styles.grid}>
        <ActiveDeliveries />
        <RecentActivity />
      </div>
    </div>
  );
};