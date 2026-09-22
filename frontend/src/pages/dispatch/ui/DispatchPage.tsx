import { DispatchOrders } from "@/widgets/dispatch-orders";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";

import styles from "./DispatchPage.module.scss";

export const DispatchPage = () => {
  useLoadVehicles();

  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        Assign vehicles and manage delivery operations.
      </p>

      <DispatchOrders />
    </div>
  );
};