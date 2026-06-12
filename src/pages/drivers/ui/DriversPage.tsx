import { DriversList } from "@/widgets/drivers-list";
import styles from "./DriversPage.module.scss";

export const DriversPage = () => {
  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        Manage drivers and monitor their assigned vehicles.
      </p>

      <DriversList />
    </div>
  );
};