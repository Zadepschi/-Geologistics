import { KpiCards } from "@/widgets/kpi-cards";
import styles from "./DashboardPage.module.scss";

export const DashboardPage = () => {
  return (
    <div className={styles.page}>
      <KpiCards />
    </div>
  );
};